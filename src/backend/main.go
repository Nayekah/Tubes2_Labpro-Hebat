package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

var INITIALIZED bool = false

var RECIPES_PATH string = "data/recipes.csv"
var IMAGES_PATH string = "data/images.csv"

type pair struct {
	First  string
	Second string
}

type tree struct {
	now           string
	childrenLeft  *tree
	childrenRight *tree
	depth         int
	depthCount    int
	leftIndent    int
	posX          int
	posY          int
}

type ImageInfo struct {
	Link string `json:"image_link"`
	Row  int    `json:"image_pos_row"`
	Col  int    `json:"image_pos_col"`
	Name string `json:"image_name"`
	Id   int    `json:"image_id"`
}

type LineInfo struct {
	From_x int `json:"from_x"`
	From_y int `json:"from_y"`
	To_x   int `json:"to_x"`
	To_y   int `json:"to_y"`
}

type Response struct {
	Images []ImageInfo `json:"images"`
	Lines  []LineInfo  `json:"lines"`
}

var recipes map[string][]pair = make(map[string][]pair)
var imagesLink map[string]string = make(map[string]string)
var distances map[string]int = make(map[string]int)

// runScraperProcess executes the scraper.go file to generate data
func runScraperProcess() error {
	fmt.Println("Running scraper to generate data files...")

	// Create data directory if it doesn't exist
	dataDir := filepath.Dir(RECIPES_PATH)
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Get the current directory
	currentDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current working directory: %w", err)
	}

	// Look for scraper.go in the usual locations
	scraperLocs := []string{
		filepath.Join(currentDir, "scraper.go"),
		filepath.Join(currentDir, "backend", "scraper.go"),
		filepath.Join(currentDir, "..", "backend", "scraper.go"),
		filepath.Join(currentDir, "backend", "scraper", "scraper.go"),
		filepath.Join(currentDir, "..", "backend", "scraper", "scraper.go"),
	}

	var scraperPath string
	for _, loc := range scraperLocs {
		if _, err := os.Stat(loc); err == nil {
			scraperPath = loc
			break
		}
	}

	if scraperPath == "" {
		return fmt.Errorf("scraper.go not found in expected locations")
	}

	fmt.Printf("Found scraper at: %s\n", scraperPath)

	// Run go run scraper.go
	cmd := exec.Command("go", "run", scraperPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to run scraper: %w", err)
	}

	// Verify data files were created
	if _, err := os.Stat(RECIPES_PATH); os.IsNotExist(err) {
		return fmt.Errorf("scraper did not create recipes file at %s", RECIPES_PATH)
	}

	if _, err := os.Stat(IMAGES_PATH); os.IsNotExist(err) {
		return fmt.Errorf("scraper did not create images file at %s", IMAGES_PATH)
	}

	fmt.Println("Scraper completed successfully")
	return nil
}

func readRecipes() {
	fmt.Println("Reading recipes from", RECIPES_PATH)

	file, err := os.Open(RECIPES_PATH)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	// Create a new CSV reader
	reader := csv.NewReader(file)

	// Read all records
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	// Loop through records
	for _, record := range records {
		result := record[0]

		ingredient1 := record[1]
		ingredient2 := record[2]

		recipes[result] = append(recipes[result], pair{ingredient1, ingredient2})

		distances[result] = -1
		distances[ingredient1] = -1
		distances[ingredient2] = -1
	}

	fmt.Println("Recipes loaded successfully")
}

func readImages() {
	file, err := os.Open(IMAGES_PATH)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	// Create a new CSV reader
	reader := csv.NewReader(file)

	// Read all records
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	// Loop through records
	for _, record := range records {
		item := record[0]
		link := record[1]

		imagesLink[item] = link
	}
}

func findAllDistances() {
	fmt.Println("Finding all distances")

	distances["Air"] = 0
	distances["Water"] = 0
	distances["Earth"] = 0
	distances["Water"] = 0
	distances["Fire"] = 0
	distances["Time"] = 0

	for i := 0; i < 20; i++ {
		for key, value := range recipes {
			if distances[key] == -1 {
				min_distance := 1000000
				for _, pair := range value {
					if distances[pair.First] != -1 && distances[pair.Second] != -1 {
						min_distance = min(min_distance, max(distances[pair.First], distances[pair.Second])+1)
					}
				}

				if min_distance != 1000000 {
					distances[key] = min_distance
					//fmt.Println(key, " : ", distances[key])
				}
			}
		}
	}
}

func INITIALIZE() {
	if INITIALIZED == false {
		INITIALIZED = true

		// Check if data files exist, if not run scraper
		_, errRecipes := os.Stat(RECIPES_PATH)
		_, errImages := os.Stat(IMAGES_PATH)

		if os.IsNotExist(errRecipes) || os.IsNotExist(errImages) {
			fmt.Println("Data files not found, running scraper...")

			if err := runScraperProcess(); err != nil {
				log.Fatalf("Failed to run scraper: %v", err)
			}
		}

		var wg sync.WaitGroup
		doneFuncA := make(chan struct{})

		wg.Add(3)
		go func() {
			defer wg.Done()
			readRecipes()
			close(doneFuncA)
		}()

		go func() {
			defer wg.Done()
			readImages()
		}()

		go func() {
			defer wg.Done()
			<-doneFuncA
			findAllDistances()
		}()

		wg.Wait()
	}
}

type requestData struct {
	Target string `json:"target"`
	// nanti tambahin tambahin terserah
}

func requestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		// Handle preflight
		w.WriteHeader(http.StatusOK)
		return
	}

	var data requestData
	err := json.NewDecoder(r.Body).Decode(&data)
	fmt.Println("Searching for target:", data.Target)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	images, lines := singleBFS(data.Target)

	response := Response{
		Images: images,
		Lines:  lines,
	}
	//fmt.Println(response)
	json.NewEncoder(w).Encode(response)
}

func singleBFS(target string) ([]ImageInfo, []LineInfo) {
	///make a 2d vector of string
	existingTree := make([]*tree, 0)

	Tree := &tree{now: target, childrenLeft: nil, childrenRight: nil}

	maxDepth := 0
	count := 0

	queue := make([]*tree, 0)
	queue = append(queue, Tree)

	var countNotPadding int = 0
	for len(queue) > 0 {
		node := queue[0]

		//fmt.Println("Depth: ", node.depth, " Count: ", node.depthCount, " Node: ", node.now, " countNotPadding: ", countNotPadding)

		if maxDepth < node.depth {
			count = 0
			if countNotPadding == 0 {
				break
			}

			maxDepth = node.depth
			countNotPadding = 0
		}

		if node.now != "padding" {
			countNotPadding = countNotPadding + 1
		}

		node.depthCount = count
		count++

		existingTree = append(existingTree, node)

		queue = queue[1:]

		uncraftable := true
		if node.now != "padding" {
			for _, pair := range recipes[node.now] {
				if (max(distances[pair.First], distances[pair.Second]) + 1) == distances[node.now] {
					node.childrenLeft = &tree{now: pair.First, childrenLeft: nil, childrenRight: nil}
					node.childrenRight = &tree{now: pair.Second, childrenLeft: nil, childrenRight: nil}
					node.childrenLeft.depth = node.depth + 1
					node.childrenRight.depth = node.depth + 1

					queue = append(queue, node.childrenLeft, node.childrenRight)
					uncraftable = false

					break
				}
			}
		}

		if uncraftable {
			tree1 := &tree{now: "padding", childrenLeft: nil, childrenRight: nil}
			tree1.depth = node.depth + 1
			node.childrenLeft = tree1

			tree2 := &tree{now: "padding", childrenLeft: nil, childrenRight: nil}
			tree2.depth = node.depth + 1
			node.childrenRight = tree2

			queue = append(queue, node.childrenLeft, node.childrenRight)
		}
	}

	// output testing
	// spacing := 10
	// for i := len(existingTree) - 1; i >= 0; i-- {
	// 	if existingTree[i].depth == maxDepth {
	// 		continue
	// 	}

	// 	j := i

	// 	for existingTree[j].depth == existingTree[i].depth {
	// 		j--
	// 		if j < 0 {
	// 			break
	// 		}
	// 	}
	// 	j = j + 1

	// 	for k := j; k <= i; k++ {
	// 		if k == j {
	// 			format := fmt.Sprintf("%%%ds", (spacing+1)/2) // Note: %% to escape %
	// 			fmt.Printf(format, existingTree[k].now)
	// 		} else {
	// 			format := fmt.Sprintf("%%%ds", spacing) // Note: %% to escape %
	// 			fmt.Printf(format, existingTree[k].now)
	// 		}
	// 	}

	// 	fmt.Println("")
	// 	spacing *= 2

	// 	i = j
	// }

	spacing := 100
	images := make([]ImageInfo, 0)
	//send to json
	for i := len(existingTree) - 1; i >= 0; i-- {
		if existingTree[i].depth == maxDepth {
			continue
		}

		j := i

		for existingTree[j].depth == existingTree[i].depth {
			j--
			if j < 0 {
				break
			}
		}
		j = j + 1

		for k := j; k <= i; k++ {
			//fmt.Println("Item = ", existingTree[k].now, " Link = ", imagesLink[existingTree[k].now])
			if k == j {
				existingTree[k].posX = spacing / 2
				existingTree[k].posY = (maxDepth-existingTree[k].depth)*100 - 100
				images = append(images, ImageInfo{
					Link: "http://localhost:8080/images/" + existingTree[k].now + "_2.svg",
					Row:  (maxDepth-existingTree[k].depth)*100 - 100,
					Col:  spacing / 2,
					Name: existingTree[k].now,
					Id:   k,
				})
			} else {
				existingTree[k].posX = spacing/2 + spacing*existingTree[k].depthCount
				existingTree[k].posY = (maxDepth-existingTree[k].depth)*100 - 100

				images = append(images, ImageInfo{
					Link: "http://localhost:8080/images/" + existingTree[k].now + "_2.svg",
					Row:  (maxDepth-existingTree[k].depth)*100 - 100,
					Col:  spacing/2 + spacing*existingTree[k].depthCount,
					Name: existingTree[k].now,
					Id:   k})
			}
		}
		spacing *= 2
		i = j
	}

	lines := make([]LineInfo, 0)
	for i := 0; i < len(existingTree); i++ {
		if existingTree[i].now != "padding" && existingTree[i].childrenLeft.now != "padding" && existingTree[i].childrenRight.now != "padding" {
			lines = append(lines, LineInfo{
				To_x:   existingTree[i].posX,
				To_y:   existingTree[i].posY,
				From_x: (existingTree[i].childrenLeft.posX + existingTree[i].childrenRight.posX) / 2,
				From_y: existingTree[i].childrenLeft.posY,
			})

			lines = append(lines, LineInfo{
				To_x:   existingTree[i].childrenLeft.posX,
				To_y:   existingTree[i].childrenLeft.posY,
				From_x: existingTree[i].childrenRight.posX,
				From_y: existingTree[i].childrenRight.posY,
			})
		}
	}

	return images, lines
}

func main() {
	INITIALIZE()

	http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("data/images"))))
	http.HandleFunc("/api", requestHandler)
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Server is working"))
	})

	fmt.Println("Server started on port 8080")
	http.ListenAndServe(":8080", nil)
}

// Helper functions
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
