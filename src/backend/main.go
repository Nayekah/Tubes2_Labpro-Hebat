package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// Global variables
var INITIALIZED bool = false
var RECIPES_PATH string = "data/recipes.csv"
var IMAGES_PATH string = "data/images.csv"

type pair struct {
	First  string
	Second string
}

const MINSEP_X = 100 // Horizontal spacing
const MINSEP_Y = 100 // Vertical spacing

type Extreme struct {
	node  *tree
	off   int
	level int
}

/*	Implementation of Tidy Tree
* 	Reference : https://reingold.co/tidier-drawings.pdf
 */
type tree struct {
	id         int
	now        string
	children   []*tree
	childCount int
	depth      int
	parent     *tree
	posX       int
	posY       int

	// extra fields for layout
	prelim   int
	mod      int
	shift    int
	change   int
	thread   *tree
	ancestor *tree
	number   int // index among siblings
}

type ImageInfo struct {
	Link string `json:"image_link"`
	Row  int    `json:"image_pos_row"`
	Col  int    `json:"image_pos_col"`
	Name string `json:"image_name"`
	Id   int    `json:"image_id"`
}

type LineInfo struct {
	From_x  int `json:"from_x"`
	From_y  int `json:"from_y"`
	From_Id int `json:"from_id"`
	To_x    int `json:"to_x"`
	To_y    int `json:"to_y"`
	To_Id   int `json:"to_id"`
}

type Response struct {
	Images []ImageInfo `json:"images"`
	Lines  []LineInfo  `json:"lines"`
}

type requestData struct {
	Target string `json:"target"`
	// nanti tambahin tambahin terserah
}

var recipes map[string][]pair = make(map[string][]pair)
var imagesLink map[string]string = make(map[string]string)
var distances map[string]int = make(map[string]int)

// getImageURL dynamically generates the image URL based on the request host
func getImageURL(c *gin.Context, imageName string) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}

	host := c.Request.Host

	return fmt.Sprintf("%s://%s/images/%s_2.svg", scheme, host, imageName)
}

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

		//change space of item to underscore
		item = strings.ReplaceAll(item, " ", "_")

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

func getTidyTree(root *tree, existingTree *[]*tree) {
	assignDepth(root, 0)
	assignNumbers(root)
	firstWalk(root)
	secondWalk(root, 0)
	normalizeCoordinates(root)
	collectTree(root, existingTree)
}

func assignDepth(n *tree, d int) {
	n.depth = d
	for _, c := range n.children {
		assignDepth(c, d+1)
	}
}

func assignNumbers(n *tree) {
	for i, c := range n.children {
		c.number = i
		assignNumbers(c)
	}
}

func firstWalk(v *tree) {
	if v.childCount == 0 {
		left := leftSibling(v)
		if left != nil {
			v.prelim = left.prelim + MINSEP_X
		} else {
			v.prelim = 0
		}
	} else {
		defaultAncestor := v.children[0]
		for _, w := range v.children {
			firstWalk(w)
			apportion(w, &defaultAncestor)
		}
		executeShifts(v)
		leftmost := v.children[0]
		rightmost := v.children[v.childCount-1]
		mid := (leftmost.prelim + rightmost.prelim) / 2
		left := leftSibling(v)
		if left != nil {
			v.prelim = left.prelim + MINSEP_X
			v.mod = v.prelim - mid
		} else {
			v.prelim = mid
		}
	}
}

func secondWalk(v *tree, m int) {
	v.posX = v.prelim + m
	v.posY = -1 * v.depth * MINSEP_Y
	for _, c := range v.children {
		secondWalk(c, m+v.mod)
	}
}

func apportion(v *tree, defaultAncestor **tree) {
	w := leftSibling(v)
	if w == nil {
		return
	}
	vip, vop := v, v
	vim, vom := w, leftmostSibling(v)
	sip, sop := vip.mod, vop.mod
	sim, som := vim.mod, vom.mod

	for nextRight(vim) != nil && nextLeft(vip) != nil {
		vim = nextRight(vim)
		vip = nextLeft(vip)
		vom = nextLeft(vom)
		vop = nextRight(vop)
		vop.ancestor = v
		shift := (vim.prelim + sim) - (vip.prelim + sip) + MINSEP_X
		if shift > 0 {
			ancestor := getAncestor(vim, v)
			if ancestor == nil {
				ancestor = *defaultAncestor
			}
			moveSubtree(ancestor, v, shift)
			sip += shift
			sop += shift
		}
		sim += vim.mod
		sip += vip.mod
		som += vom.mod
		sop += vop.mod
	}

	if nextRight(vim) != nil && nextRight(vop) == nil {
		vop.thread = nextRight(vim)
		vop.mod += sim - sop
	}
	if nextLeft(vip) != nil && nextLeft(vom) == nil {
		vom.thread = nextLeft(vip)
		vom.mod += sip - som
		*defaultAncestor = v
	}
}

func moveSubtree(wm, wp *tree, shift int) {
	subtrees := wp.number - wm.number
	if subtrees == 0 {
		return
	}
	shiftPerSubtree := float64(shift) / float64(subtrees)
	wp.change -= int(math.Round(shiftPerSubtree))
	wp.shift += shift
	wm.change += int(math.Round(shiftPerSubtree))
	wp.prelim += shift
	wp.mod += shift
}

func executeShifts(v *tree) {
	shift := 0
	change := 0
	for i := v.childCount - 1; i >= 0; i-- {
		w := v.children[i]
		w.prelim += shift
		w.mod += shift
		change += w.change
		shift += w.shift + change
	}
}

func getAncestor(vi, v *tree) *tree {
	if vi.parent == nil || vi.parent != v.parent {
		return nil
	}
	return vi.ancestor
}

func leftSibling(n *tree) *tree {
	if n.parent == nil {
		return nil
	}
	idx := -1
	for i, c := range n.parent.children {
		if c == n {
			idx = i
			break
		}
	}
	if idx > 0 {
		return n.parent.children[idx-1]
	}
	return nil
}

func leftmostSibling(n *tree) *tree {
	if n.parent == nil || len(n.parent.children) == 0 {
		return nil
	}
	return n.parent.children[0]
}

func nextLeft(n *tree) *tree {
	if n.childCount == 0 {
		return n.thread
	}
	return n.children[0]
}

func nextRight(n *tree) *tree {
	if n.childCount == 0 {
		return n.thread
	}
	return n.children[n.childCount-1]
}

func normalizeCoordinates(root *tree) {
	xmin := findMinX(root)
	ymin := findMinY(root)
	adjust(root, xmin, ymin)
}

func findMinX(n *tree) int {
	min := n.posX
	for _, c := range n.children {
		cx := findMinX(c)
		if cx < min {
			min = cx
		}
	}
	return min
}

func findMinY(n *tree) int {
	min := n.posY
	for _, c := range n.children {
		cy := findMinY(c)
		if cy < min {
			min = cy
		}
	}
	return min
}

func adjust(n *tree, dx, dy int) {
	n.posX -= dx
	n.posY -= dy
	for _, c := range n.children {
		adjust(c, dx, dy)
	}
}

func collectTree(n *tree, out *[]*tree) {
	*out = append(*out, n)
	for _, c := range n.children {
		collectTree(c, out)
	}
}

func singleBFS(c *gin.Context, target string) ([]ImageInfo, []LineInfo) {
	countId := 0

	type SafeTree struct {
		queue        []*tree
		existingTree []*tree
		mu           sync.Mutex
	}

	Tree := &tree{now: target}
	safe := &SafeTree{
		queue:        []*tree{Tree},
		existingTree: []*tree{},
	}

	for len(safe.queue) > 0 {
		var wg sync.WaitGroup

		// Extract up to 4 nodes from the queue
		safe.mu.Lock()
		batchSize := min(4, len(safe.queue))
		batch := safe.queue[:batchSize]
		safe.queue = safe.queue[batchSize:]
		safe.mu.Unlock()

		wg.Add(len(batch))

		for _, node := range batch {
			go func(n *tree) {
				defer wg.Done()

				// Track depth
				safe.mu.Lock()
				safe.existingTree = append(safe.existingTree, n)
				n.id = countId
				countId++
				safe.mu.Unlock()

				// Handle BFS step and enqueue new nodes
				for _, pair := range recipes[n.now] {
					if max(distances[pair.First], distances[pair.Second])+1 == distances[n.now] && pair.First != "Time" && pair.Second != "Time" {
						left := &tree{now: pair.First, depth: n.depth + 1, parent: n}
						right := &tree{now: pair.Second, depth: n.depth + 1, parent: n}
						n.children = append(n.children, left, right)
						n.childCount += 2

						safe.mu.Lock()
						safe.queue = append(safe.queue, left, right)
						safe.mu.Unlock()
						break
					}
				}
			}(node)
		}
		wg.Wait() // Wait for this batch to finish
	}

	safe.existingTree = safe.existingTree[:0] // Clear the existing tree for the next step
	getTidyTree(Tree, &safe.existingTree)

	//fmt.Println("Tidy tree generated. Total nodes:", len(safe.existingTree))

	// Generate image info
	images := make([]ImageInfo, 0)
	// Generate Line info
	lines := make([]LineInfo, 0)

	// BFS to generate images
	queue := make([]*tree, 0)
	queue = append(queue, Tree)
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

		images = append(images, ImageInfo{
			Link: getImageURL(c, strings.ReplaceAll(node.now, " ", "_")),
			Row:  node.posY,
			Col:  node.posX,
			Name: node.now,
			Id:   node.id,
		})

		for i := 0; i < node.childCount; i += 2 {
			left := node.children[i]
			right := node.children[i+1]

			lines = append(lines, LineInfo{
				From_x:  left.posX,
				From_y:  left.posY,
				From_Id: left.id,
				To_x:    right.posX,
				To_y:    right.posY,
				To_Id:   right.id,
			})

			lines = append(lines, LineInfo{
				From_x:  (right.posX + left.posX) / 2,
				From_y:  right.posY,
				From_Id: right.id,
				To_x:    node.posX,
				To_y:    node.posY,
				To_Id:   left.id,
			})
		}

		for _, child := range node.children {
			queue = append(queue, child)
		}
	}

	return images, lines
}

// API handlers
func handleSearch(c *gin.Context) {
	var data requestData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	target := data.Target
	runes := []rune(target)
	for i := 1; i < len(runes); i++ {
		if 'A' <= runes[i] && runes[i] <= 'Z' {
			runes[i] = runes[i] + 32
		}
	}
	if runes[0] >= 'a' && runes[0] <= 'z' {
		runes[0] = runes[0] - 32
	}
	target = string(runes)

	fmt.Println("Searching for target:", target)
	images, lines := singleBFS(c, target)

	response := Response{
		Images: images,
		Lines:  lines,
	}

	c.JSON(http.StatusOK, response)
}

func handleTest(c *gin.Context) {
	c.String(http.StatusOK, "Server is working")
}

func main() {
	// Initialize data
	INITIALIZE()

	// Set Gin to release mode for production
	gin.SetMode(gin.ReleaseMode)

	// Create a default Gin router
	r := gin.Default()

	// Configure CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// Serve static files
	r.Static("/images", "./data/images")

	// API routes
	r.POST("/api", handleSearch)
	r.GET("/test", handleTest)

	// Start the server
	port := ":8080"
	fmt.Printf("Server started on port%s\n", port)
	r.Run(port)
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
