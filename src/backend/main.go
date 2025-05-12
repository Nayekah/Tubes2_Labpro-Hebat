package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"sync/atomic"

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
const NODE_HEIGHT = 60
const LEVEL_SEP = 100
const NODE_WIDTH = 60
const SIBLING_SEP = 40
const SUBTREE_SEP = 10

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
	now        string  // Node name or value
	parent     *tree   // Parent node
	children   []*tree // Child nodes
	childCount int     // Number of children

	// Layout properties
	depth    int   // Depth in the tree
	number   int   // Number among siblings
	prelim   int   // Preliminary x-coordinate
	mod      int   // Modifier for children
	shift    int   // Shift applied to subtree
	change   int   // Change in shift
	posX     int   // Final x position
	posY     int   // Final y position
	thread   *tree // Thread to next node in contour
	ancestor *tree // For ancestor optimization
}

type ContourNode struct {
	level int
	posX  int
	next  *ContourNode
}

// TreeExtents represents the horizontal extent of a subtree
type TreeExtents struct {
	left  *ContourNode // Left contour
	right *ContourNode // Right contour
	width int          // Width of the subtree
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
	Target       string `json:"target"`
	Method       string `json:"method"`
	Option       string `json:"option"`
	NumOfRecipes int    `json:"num_of_recipes"`
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

var maxDepth int

func getTidyTree(root *tree, existingTree *[]*tree) {
	if root == nil {
		return
	}

	// Initialize depths and other properties
	assignDepths(root, 0)

	// Calculate the initial positions
	calculateInitialPositions(root, 0)

	// Ensure no subtrees overlap
	resolveOverlaps(root)

	// Center parent nodes over their children
	centerParents(root)

	// Normalize coordinates to ensure all are positive
	normalizeCoordinates(root)

	// Collect all tree nodes into the provided slice
	*existingTree = make([]*tree, 0)
	collectTree(root, existingTree)
}

// assignDepths assigns depth values to each node in the tree
func assignDepths(node *tree, depth int) {
	node.depth = depth
	for _, child := range node.children {
		assignDepths(child, depth+1)
	}
}

// calculateInitialPositions calculates x-coordinates based on the enhanced algorithm
func calculateInitialPositions(node *tree, offset int) int {
	if len(node.children) == 0 {
		// Leaf node
		node.posX = offset
		node.posY = node.depth * LEVEL_SEP
		return node.posX + NODE_WIDTH
	}

	// Initialize the position for the first child
	childOffset := offset

	// Position all children first
	for _, child := range node.children {
		childOffset = calculateInitialPositions(child, childOffset)
		if child != node.children[len(node.children)-1] {
			childOffset += SIBLING_SEP // Add separation between siblings
		}
	}

	// Calculate parent's position (centered over children)
	firstChild := node.children[0]
	lastChild := node.children[len(node.children)-1]

	// Position the parent centered over its children
	node.posX = (firstChild.posX + lastChild.posX) / 2
	node.posY = node.depth * LEVEL_SEP

	return childOffset
}

// resolveOverlaps ensures no subtrees overlap by shifting them if necessary
func resolveOverlaps(root *tree) {
	// Create a map to store nodes by level
	levelMap := make(map[int][]*tree)
	collectNodesByLevel(root, levelMap)

	// Process levels from bottom to top
	maxDepth := 0
	for depth := range levelMap {
		if depth > maxDepth {
			maxDepth = depth
		}
	}

	// Process each level starting from the bottom
	for depth := maxDepth; depth >= 0; depth-- {
		nodesAtLevel := levelMap[depth]

		// Sort nodes at this level by x-coordinate
		sort.Slice(nodesAtLevel, func(i, j int) bool {
			return nodesAtLevel[i].posX < nodesAtLevel[j].posX
		})

		// Check and fix overlaps between adjacent subtrees
		for i := 1; i < len(nodesAtLevel); i++ {
			leftNode := nodesAtLevel[i-1]
			rightNode := nodesAtLevel[i]

			// Calculate subtree widths
			leftExtent := getSubtreeRightExtent(leftNode)
			rightExtent := getSubtreeLeftExtent(rightNode)

			// Calculate current gap between subtrees
			gap := rightExtent - leftExtent

			// If gap is less than minimum required, shift the right subtree
			if gap < SUBTREE_SEP {
				shift := SUBTREE_SEP - gap
				shiftSubtree(rightNode, shift)
			}
		}

		// After fixing overlaps at this level, ensure parents are centered
		for _, node := range nodesAtLevel {
			if len(node.children) > 0 {
				// Recenter parent over its children after potential shifting
				centerNodeOverChildren(node)
			}
		}
	}
}

// getSubtreeLeftExtent returns the leftmost x-coordinate in a subtree
func getSubtreeLeftExtent(node *tree) int {
	if len(node.children) == 0 {
		return node.posX
	}

	leftmost := node.posX
	for _, child := range node.children {
		childLeft := getSubtreeLeftExtent(child)
		if childLeft < leftmost {
			leftmost = childLeft
		}
	}
	return leftmost
}

// getSubtreeRightExtent returns the rightmost x-coordinate in a subtree
func getSubtreeRightExtent(node *tree) int {
	if len(node.children) == 0 {
		return node.posX + NODE_WIDTH
	}

	rightmost := node.posX + NODE_WIDTH
	for _, child := range node.children {
		childRight := getSubtreeRightExtent(child)
		if childRight > rightmost {
			rightmost = childRight
		}
	}
	return rightmost
}

// shiftSubtree moves a subtree by shifting all nodes horizontally
func shiftSubtree(node *tree, shift int) {
	node.posX += shift
	for _, child := range node.children {
		shiftSubtree(child, shift)
	}
}

// collectNodesByLevel collects nodes into a map keyed by depth
func collectNodesByLevel(node *tree, levelMap map[int][]*tree) {
	if _, exists := levelMap[node.depth]; !exists {
		levelMap[node.depth] = make([]*tree, 0)
	}
	levelMap[node.depth] = append(levelMap[node.depth], node)

	for _, child := range node.children {
		collectNodesByLevel(child, levelMap)
	}
}

// centerParents ensures all parents are properly centered over their children
func centerParents(node *tree) {
	if len(node.children) > 0 {
		centerNodeOverChildren(node)

		// Process all children recursively
		for _, child := range node.children {
			centerParents(child)
		}
	}
}

// centerNodeOverChildren centers a node over its children
func centerNodeOverChildren(node *tree) {
	if len(node.children) == 0 {
		return
	}

	// Find leftmost and rightmost child positions
	leftmostX := node.children[0].posX
	rightmostX := node.children[len(node.children)-1].posX

	// Center parent over the midpoint of extreme children
	newX := (leftmostX + rightmostX) / 2

	// Only adjust if position has changed
	if newX != node.posX {
		node.posX = newX
	}
}

// normalizeCoordinates ensures all coordinates are positive
func normalizeCoordinates(root *tree) {
	// Find minimum x and y coordinates
	minX := findMinX(root)
	minY := findMinY(root)

	// If any coordinates are negative, shift the entire tree
	if minX < 0 || minY < 0 {
		shiftX := 0
		shiftY := 0

		if minX < 0 {
			shiftX = -minX
		}

		if minY < 0 {
			shiftY = -minY
		}

		// Shift the entire tree
		shiftEntireTree(root, shiftX, shiftY)
	}
}

// findMinX finds the minimum x-coordinate in the tree
func findMinX(node *tree) int {
	min := node.posX

	for _, child := range node.children {
		childMin := findMinX(child)
		if childMin < min {
			min = childMin
		}
	}

	return min
}

// findMinY finds the minimum y-coordinate in the tree
func findMinY(node *tree) int {
	min := node.posY

	for _, child := range node.children {
		childMin := findMinY(child)
		if childMin < min {
			min = childMin
		}
	}

	return min
}

// shiftEntireTree shifts the entire tree by the given amounts
func shiftEntireTree(node *tree, shiftX, shiftY int) {
	node.posX += shiftX
	node.posY += shiftY

	for _, child := range node.children {
		shiftEntireTree(child, shiftX, shiftY)
	}
}

// collectTree gathers all nodes in the tree into a flat slice
func collectTree(node *tree, result *[]*tree) {
	node.posY *= -1;
	*result = append(*result, node)

	for _, child := range node.children {
		collectTree(child, result)
	}
}

func singleDFS(c *gin.Context, target string) ([]ImageInfo, []LineInfo) {
	countId := 0

	type SafeTree struct {
		stack        []*tree
		existingTree []*tree
		mu           sync.Mutex
	}

	Tree := &tree{now: target}
	safe := &SafeTree{
		stack:        []*tree{Tree},
		existingTree: []*tree{},
	}

	for len(safe.stack) > 0 {
		var wg sync.WaitGroup

		// Extract up to 4 nodes from the end of the stack
		safe.mu.Lock()
		batchSize := min(4, len(safe.stack))
		batch := make([]*tree, batchSize)
		copy(batch, safe.stack[len(safe.stack)-batchSize:])
		safe.stack = safe.stack[:len(safe.stack)-batchSize]
		safe.mu.Unlock()

		//fmt.Println("Stack size:", len(safe.stack))

		wg.Add(len(batch))

		for _, node := range batch {
			go func(n *tree) {
				defer wg.Done()

				safe.mu.Lock()
				n.id = countId
				countId++
				safe.mu.Unlock()

				// DFS step: add children to the stack
				for _, pair := range recipes[n.now] {
					if max(distances[pair.First], distances[pair.Second]) < distances[n.now] {
						left := &tree{now: pair.First, depth: n.depth + 1, parent: n}
						right := &tree{now: pair.Second, depth: n.depth + 1, parent: n}
						n.children = append(n.children, left, right)
						n.childCount += 2

						safe.mu.Lock()
						safe.stack = append(safe.stack, right, left) // Push in reverse order
						safe.mu.Unlock()
						break
					}
				}
			}(node)
		}
		wg.Wait()
	}

	getTidyTree(Tree, &safe.existingTree)

	//fmt.Println("Tidy tree generated. Total nodes:", len(safe.existingTree))

	// Generate image info
	images := make([]ImageInfo, 0)
	// Generate Line info
	lines := make([]LineInfo, 0)

	// BFS to generate images
	stack := make([]*tree, 0)
	stack = append(stack, Tree)
	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		//fmt.Println("Processing node:", node.now, "ID:", node.id)

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
			stack = append(stack, child)
		}
	}

	return images, lines
}

func multiDFS(c *gin.Context, target string, count int) ([]ImageInfo, []LineInfo) {
	countId := 0
	counter := int32(0)

	type SafeTree struct {
		stack        []*tree
		existingTree []*tree
		mu           sync.Mutex
	}

	Tree := &tree{now: target}
	safe := &SafeTree{
		stack:        []*tree{Tree},
		existingTree: []*tree{},
	}

	for len(safe.stack) > 0 {
		var wg sync.WaitGroup

		// Extract up to 4 nodes from the end of the stack (LIFO for DFS)
		safe.mu.Lock()
		batchSize := min(4, len(safe.stack))
		batch := make([]*tree, batchSize)
		copy(batch, safe.stack[len(safe.stack)-batchSize:])
		safe.stack = safe.stack[:len(safe.stack)-batchSize]
		safe.mu.Unlock()

		wg.Add(len(batch))

		for _, node := range batch {
			go func(n *tree) {
				defer wg.Done()

				safe.mu.Lock()
				n.id = countId
				countId++
				safe.mu.Unlock()

				// DFS step: add children to the stack
				for _, pair := range recipes[n.now] {
					if atomic.LoadInt32(&counter) < int32(count) {
						atomic.AddInt32(&counter, 1)

						left := &tree{now: pair.First, depth: n.depth + 1, parent: n}
						right := &tree{now: pair.Second, depth: n.depth + 1, parent: n}
						n.children = append(n.children, left, right)
						n.childCount += 2

						safe.mu.Lock()
						// Push in reverse order for DFS
						safe.stack = append(safe.stack, right, left)
						safe.mu.Unlock()
					} else {
						if max(distances[pair.First], distances[pair.Second]) < distances[n.now] {
							left := &tree{now: pair.First, depth: n.depth + 1, parent: n}
							right := &tree{now: pair.Second, depth: n.depth + 1, parent: n}
							n.children = append(n.children, left, right)
							n.childCount += 2

							safe.mu.Lock()
							safe.stack = append(safe.stack, right, left)
							safe.mu.Unlock()
							break
						}
					}
				}
			}(node)
		}
		wg.Wait()
	}

	getTidyTree(Tree, &safe.existingTree)

	// Generate image info
	images := make([]ImageInfo, 0)
	// Generate Line info
	lines := make([]LineInfo, 0)

	// DFS to generate images
	stack := make([]*tree, 0)
	stack = append(stack, Tree)
	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

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
				To_x:    (right.posX + left.posX) / 2,
				To_y:    right.posY + 50,
				To_Id:   left.id,
			})

			lines = append(lines, LineInfo{
				From_x:  (right.posX + left.posX) / 2,
				From_y:  right.posY + 50,
				From_Id: left.id,
				To_x:    node.posX,
				To_y:    right.posY + 50,
				To_Id:   right.id,
			})

			lines = append(lines, LineInfo{
				From_x:  node.posX,
				From_y:  right.posY + 50,
				From_Id: left.id,
				To_x:    node.posX,
				To_y:    node.posY,
				To_Id:   right.id,
			})
		}

		// Push children in reverse order for DFS
		for i := node.childCount - 1; i >= 0; i-- {
			stack = append(stack, node.children[i])
		}
	}

	return images, lines
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

				//fmt.Println("Processing node:", n.now)

				// Track depth
				safe.mu.Lock()
				n.id = countId
				countId++
				safe.mu.Unlock()

				// Handle BFS step and enqueue new nodes
				for _, pair := range recipes[n.now] {
					if max(distances[pair.First], distances[pair.Second])+1 == distances[n.now] {
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

	getTidyTree(Tree, &safe.existingTree)

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

func multiBFS(c *gin.Context, target string, count int) ([]ImageInfo, []LineInfo) {
	countId := 0
	counter := int32(0)

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
				n.id = countId
				countId++
				safe.mu.Unlock()

				// Handle BFS step and enqueue new nodes
				for _, pair := range recipes[n.now] {
					if atomic.LoadInt32(&counter) < int32(count) {
						atomic.AddInt32(&counter, 1)

						left := &tree{now: pair.First, depth: n.depth + 1, parent: n}
						right := &tree{now: pair.Second, depth: n.depth + 1, parent: n}
						n.children = append(n.children, left, right)
						n.childCount += 2

						safe.mu.Lock()
						safe.queue = append(safe.queue, left, right)
						safe.mu.Unlock()
					} else {
						if max(distances[pair.First], distances[pair.Second])+1 == distances[n.now] {
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
				}
			}(node)
		}
		wg.Wait() // Wait for this batch to finish
	}

	getTidyTree(Tree, &safe.existingTree)

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

			//fmt.Println(left.id, " -> ", node.id)
			//fmt.Println(right.id, " -> ", node.id)

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
				To_x:    (right.posX + left.posX) / 2,
				To_y:    right.posY + 50,
				To_Id:   left.id,
			})

			lines = append(lines, LineInfo{
				From_x:  (right.posX + left.posX) / 2,
				From_y:  right.posY + 50,
				From_Id: left.id,
				To_x:    node.posX,
				To_y:    right.posY + 50,
				To_Id:   right.id,
			})

			lines = append(lines, LineInfo{
				From_x:  node.posX,
				From_y:  right.posY + 50,
				From_Id: left.id,
				To_x:    node.posX,
				To_y:    node.posY,
				To_Id:   right.id,
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
		fmt.Println("Binding failed:", err)
		return
	}
	fmt.Println(data)

	target := data.Target
	method := data.Method
	option := data.Option
	num_of_recipes := data.NumOfRecipes

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
	var images []ImageInfo
	var lines []LineInfo
	if method == "DFS" {
		if option == "Shortest" {
			images, lines = singleDFS(c, target)
		} else {
			images, lines = multiDFS(c, target, num_of_recipes)
		}
	} else if method == "BFS" {
		if option == "Shortest" {
			images, lines = singleBFS(c, target)
		} else {
			images, lines = multiBFS(c, target, num_of_recipes)
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid method"})
		return
	}

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
