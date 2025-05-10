package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const BASE_URL = "https://little-alchemy.fandom.com/wiki/Elements_(Little_Alchemy_2)"

type imgRecord struct{ Key, Src string }
type recRecord struct{ Elem, Combo1, Combo2 string }

func getRootDir() string {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("Cannot get current file path")
	}
	return filepath.Dir(filepath.Dir(filepath.Dir(file)))
}

func fetchDocument() (*goquery.Document, error) {
	start := time.Now()
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", BASE_URL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; scraper)")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}
	fmt.Printf("Fetched document in %.3f s\n", time.Since(start).Seconds())
	return doc, nil
}

func main() {
	totalStart := time.Now()
	root := getRootDir()
	dataDir := filepath.Join(root, "backend", "data")
	imagesPath := filepath.Join(dataDir, "images.csv")
	recipesPath := filepath.Join(dataDir, "recipes.csv")

	doc, err := fetchDocument()
	if err != nil {
		log.Fatalf("Failed to fetch document: %v", err)
	}

	rows := doc.Find("table tr:has(td:nth-child(2))")

	nWorkers := runtime.NumCPU()
	rowChan := make(chan *goquery.Selection, rows.Length())
	imgChan := make(chan imgRecord, rows.Length())
	recChan := make(chan recRecord, rows.Length()*2)

	rows.Each(func(i int, row *goquery.Selection) {
		if i > 0 {
			rowChan <- row
		}
	})
	close(rowChan)

	var parseWg sync.WaitGroup
	parseWg.Add(nWorkers)
	for i := 0; i < nWorkers; i++ {
		go func() {
			defer parseWg.Done()
			for row := range rowChan {
				a := row.Find("td:first-child a")
				if a.Length() == 0 {
					continue
				}
				elem := strings.TrimSpace(a.Text())

				if src, ok := row.Find("td:first-child img[data-src]").Attr("data-src"); ok {
					if idx := strings.Index(src, "scale-to-width"); idx != -1 {
						src = src[:idx]
					}
					imgChan <- imgRecord{Key: elem, Src: src}
				}

				row.Find("td:nth-child(2) li").Each(func(_ int, li *goquery.Selection) {
					comps := li.Find("a:not(.image)")
					if comps.Length() == 2 {
						c1 := strings.TrimSpace(comps.Eq(0).Text())
						c2 := strings.TrimSpace(comps.Eq(1).Text())
						recChan <- recRecord{Elem: elem, Combo1: c1, Combo2: c2}
					}
				})
			}
		}()
	}

	var writeWg sync.WaitGroup
	writeWg.Add(2)

	go func() {
		defer writeWg.Done()
		if err := os.MkdirAll(filepath.Dir(imagesPath), 0755); err != nil {
			log.Fatal(err)
		}
		f, err := os.Create(imagesPath)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()
		w := bufio.NewWriter(f)
		w.WriteString("Element,Link\n")
		for rec := range imgChan {
			w.WriteString(fmt.Sprintf("%s,%s\n", rec.Key, rec.Src))
		}
		w.Flush()
	}()

	go func() {
		defer writeWg.Done()
		if err := os.MkdirAll(filepath.Dir(recipesPath), 0755); err != nil {
			log.Fatal(err)
		}
		f, err := os.Create(recipesPath)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()
		w := bufio.NewWriter(f)
		w.WriteString("Element,Combination1,Combination2\n")
		for rec := range recChan {
			w.WriteString(fmt.Sprintf("%s,%s,%s\n", rec.Elem, rec.Combo1, rec.Combo2))
		}
		w.Flush()
	}()

	parseWg.Wait()
	close(imgChan)
	close(recChan)
	writeWg.Wait()

	fmt.Printf("Total execution time: %.3f s\n", time.Since(totalStart).Seconds())
}
