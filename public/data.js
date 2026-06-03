/**
 * Algorithm Study Dashboard — Mock Data
 * Topics → Methods → Questions hierarchy
 */

const TOPICS = [
  {
    id: 'arrays',
    name: 'Arrays',
    icon: '⊞',
    description: 'Linear data structures with indexed access. Foundation of most algorithmic patterns.',
    methods: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Two Pointers</strong> technique uses two references that traverse a data structure — typically from opposite ends or at different speeds. This reduces what would be an O(n²) brute-force approach down to O(n) time.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Sorted arrays where you need to find pairs that satisfy a condition</li>
              <li>Problems involving subarrays or subsequences</li>
              <li>Removing duplicates in-place</li>
              <li>Comparing elements from both ends (palindromes, container problems)</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Initialize one pointer at the <strong>start</strong> and another at the <strong>end</strong> of the array. Move them toward each other based on a comparison condition. For the "same direction" variant, use a slow and fast pointer.</p>
          </div>
          <div class="explanation-callout">
            <strong>Key Insight</strong>
            By maintaining two pointers and narrowing the search space on each step, you eliminate redundant comparisons that nested loops would perform.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Two Sum II - Input Array Is Sorted', link: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'Medium' },
          { title: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy' },
          { title: '3Sum', link: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium' },
          { title: 'Container With Most Water', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium' },
          { title: 'Trapping Rain Water', link: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'Hard' },
          { title: 'Remove Duplicates from Sorted Array', link: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', difficulty: 'Easy' },
          { title: 'Squares of a Sorted Array', link: 'https://leetcode.com/problems/squares-of-a-sorted-array/', difficulty: 'Easy' },
        ]
      },
      {
        id: 'sliding-window',
        name: 'Sliding Window',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Sliding Window</strong> pattern maintains a subset of elements (a "window") that slides across the data structure. It's ideal for problems involving contiguous subarrays or substrings.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Finding max/min sum of a subarray of size k</li>
              <li>Longest/shortest substring with certain properties</li>
              <li>String permutation or anagram matching</li>
              <li>Any problem asking about contiguous sequences</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Fixed vs. Dynamic Window</h3>
            <p><strong>Fixed window:</strong> The window size stays constant (e.g., max sum of subarray of size k). Simply slide right by adding one element and removing another.</p>
            <p><strong>Dynamic window:</strong> The window expands and contracts based on a condition (e.g., smallest subarray with sum ≥ target). Expand the right boundary, then shrink from the left when the condition is met.</p>
          </div>
          <div class="explanation-callout">
            <strong>Key Insight</strong>
            Instead of recalculating from scratch for every subarray, reuse the computation from the previous window — add the new element, remove the old one.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code> to <code>O(k)</code></span>
          </div>
        `,
        questions: [
          { title: 'Maximum Sum Subarray of Size K', link: 'https://leetcode.com/problems/maximum-average-subarray-i/', difficulty: 'Easy' },
          { title: 'Longest Substring Without Repeating Characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium' },
          { title: 'Minimum Window Substring', link: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard' },
          { title: 'Permutation in String', link: 'https://leetcode.com/problems/permutation-in-string/', difficulty: 'Medium' },
          { title: 'Fruit Into Baskets', link: 'https://leetcode.com/problems/fruit-into-baskets/', difficulty: 'Medium' },
          { title: 'Sliding Window Maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', difficulty: 'Hard' },
        ]
      },
      {
        id: 'dutch-national-flag',
        name: 'Dutch National Flag',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Dutch National Flag</strong> algorithm (by Edsger Dijkstra) partitions an array into three groups in a single pass. It uses three pointers — <code>low</code>, <code>mid</code>, and <code>high</code> — to sort elements into three categories.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Sorting an array with exactly three distinct values</li>
              <li>Partitioning problems (e.g., around a pivot)</li>
              <li>Segregating 0s, 1s, and 2s</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Maintain three pointers: <code>low = 0</code>, <code>mid = 0</code>, <code>high = n-1</code>. Walk <code>mid</code> through the array:</p>
            <ul>
              <li>If <code>arr[mid] == 0</code>: swap with <code>low</code>, increment both</li>
              <li>If <code>arr[mid] == 1</code>: just increment <code>mid</code></li>
              <li>If <code>arr[mid] == 2</code>: swap with <code>high</code>, decrement <code>high</code></li>
            </ul>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Sort Colors', link: 'https://leetcode.com/problems/sort-colors/', difficulty: 'Medium' },
          { title: 'Move Zeroes', link: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'Easy' },
          { title: 'Sort Array By Parity', link: 'https://leetcode.com/problems/sort-array-by-parity/', difficulty: 'Easy' },
        ]
      },
      {
        id: 'prefix-sums',
        name: 'Prefix Sums',
        explanation: `
          <div class="explanation-section">
            <p><strong>Prefix Sums</strong> (also called cumulative sums) precompute a running total so that any subarray sum can be answered in O(1) time. Build an array where <code>prefix[i]</code> = sum of elements from index 0 to i.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Range sum queries on a static array</li>
              <li>Counting subarrays with a given sum</li>
              <li>Finding equilibrium index</li>
              <li>Problems involving cumulative properties</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Build: <code>prefix[i] = prefix[i-1] + arr[i]</code></p>
            <p>Query: <code>sum(l, r) = prefix[r] - prefix[l-1]</code></p>
          </div>
          <div class="explanation-callout">
            <strong>Key Insight</strong>
            Trade O(n) preprocessing for O(1) per query. Combine with hash maps to solve "subarray with sum K" problems in O(n) total.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Build: <code>O(n)</code></span>
            <span class="complexity-badge">Query: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Subarray Sum Equals K', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'Medium' },
          { title: 'Range Sum Query - Immutable', link: 'https://leetcode.com/problems/range-sum-query-immutable/', difficulty: 'Easy' },
          { title: 'Contiguous Array', link: 'https://leetcode.com/problems/contiguous-array/', difficulty: 'Medium' },
          { title: 'Product of Array Except Self', link: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium' },
          { title: 'Find Pivot Index', link: 'https://leetcode.com/problems/find-pivot-index/', difficulty: 'Easy' },
        ]
      }
    ]
  },
  {
    id: 'strings',
    name: 'Strings',
    icon: '❝',
    description: 'Sequence of characters. Master pattern matching, parsing, and string manipulation.',
    methods: [
      {
        id: 'string-hashing',
        name: 'String Hashing',
        explanation: `
          <div class="explanation-section">
            <p><strong>String Hashing</strong> converts a string into a numeric value (hash) to enable O(1) comparisons. Rolling hash techniques like Rabin-Karp allow efficient substring matching without character-by-character comparison.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Pattern matching in strings</li>
              <li>Finding duplicate substrings</li>
              <li>Comparing substrings efficiently</li>
              <li>Anagram grouping</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Rabin-Karp Rolling Hash</h3>
            <p>Compute a polynomial hash: <code>H = s[0]·p^(n-1) + s[1]·p^(n-2) + ... + s[n-1]</code>. When sliding the window, update the hash in O(1) by removing the leading character and adding the trailing one.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Average: <code>O(n+m)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Repeated DNA Sequences', link: 'https://leetcode.com/problems/repeated-dna-sequences/', difficulty: 'Medium' },
          { title: 'Group Anagrams', link: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'Medium' },
          { title: 'Longest Duplicate Substring', link: 'https://leetcode.com/problems/longest-duplicate-substring/', difficulty: 'Hard' },
          { title: 'Implement strStr()', link: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', difficulty: 'Easy' },
        ]
      },
      {
        id: 'palindrome-techniques',
        name: 'Palindrome Techniques',
        explanation: `
          <div class="explanation-section">
            <p><strong>Palindrome Techniques</strong> cover strategies for detecting, expanding, and manipulating palindromic strings — sequences that read the same forwards and backwards.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 Core Approaches</h3>
            <ul>
              <li><strong>Expand Around Center:</strong> For each index (and each gap between indices), expand outward while characters match. Finds all palindromic substrings in O(n²).</li>
              <li><strong>Manacher's Algorithm:</strong> Finds the longest palindromic substring in O(n) using previously computed palindrome radii to skip redundant checks.</li>
              <li><strong>DP Approach:</strong> Build a table where <code>dp[i][j]</code> = true if substring from i to j is a palindrome.</li>
            </ul>
          </div>
          <div class="explanation-callout">
            <strong>Key Insight</strong>
            Most palindrome problems reduce to "expand around center." Start with this approach — it's intuitive and efficient enough for most interview contexts.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Expand: <code>O(n²)</code></span>
            <span class="complexity-badge">Manacher: <code>O(n)</code></span>
          </div>
        `,
        questions: [
          { title: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy' },
          { title: 'Longest Palindromic Substring', link: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'Medium' },
          { title: 'Palindromic Substrings', link: 'https://leetcode.com/problems/palindromic-substrings/', difficulty: 'Medium' },
          { title: 'Palindrome Partitioning', link: 'https://leetcode.com/problems/palindrome-partitioning/', difficulty: 'Medium' },
          { title: 'Shortest Palindrome', link: 'https://leetcode.com/problems/shortest-palindrome/', difficulty: 'Hard' },
        ]
      },
      {
        id: 'string-manipulation',
        name: 'String Manipulation',
        explanation: `
          <div class="explanation-section">
            <p><strong>String Manipulation</strong> covers fundamental operations: reversal, rotation, compression, encoding/decoding, and in-place transformations. These form the building blocks of more complex string algorithms.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 Common Patterns</h3>
            <ul>
              <li><strong>Two-pointer reversal:</strong> Swap characters from ends moving inward</li>
              <li><strong>StringBuilder pattern:</strong> Build result character-by-character to avoid O(n²) concatenation</li>
              <li><strong>Character frequency maps:</strong> Use arrays of size 26/128/256 for counting</li>
              <li><strong>Stack-based parsing:</strong> For nested structures, matching brackets, decoding</li>
            </ul>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Typical: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(n)</code></span>
          </div>
        `,
        questions: [
          { title: 'Reverse String', link: 'https://leetcode.com/problems/reverse-string/', difficulty: 'Easy' },
          { title: 'String Compression', link: 'https://leetcode.com/problems/string-compression/', difficulty: 'Medium' },
          { title: 'Decode String', link: 'https://leetcode.com/problems/decode-string/', difficulty: 'Medium' },
          { title: 'Reverse Words in a String', link: 'https://leetcode.com/problems/reverse-words-in-a-string/', difficulty: 'Medium' },
          { title: 'Multiply Strings', link: 'https://leetcode.com/problems/multiply-strings/', difficulty: 'Medium' },
        ]
      }
    ]
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    icon: '⟶',
    description: 'Node-based sequential structures. Key patterns include fast/slow pointers and reversal.',
    methods: [
      {
        id: 'fast-slow-pointers',
        name: 'Fast & Slow Pointers',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Fast & Slow Pointers</strong> (Floyd's Tortoise and Hare) technique uses two pointers moving at different speeds to detect cycles, find middle elements, and solve related problems in linked lists.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Detecting cycles in a linked list</li>
              <li>Finding the middle node</li>
              <li>Finding the start of a cycle</li>
              <li>Checking if a linked list is a palindrome</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Start both pointers at the head. Move <code>slow</code> by one step and <code>fast</code> by two steps. If a cycle exists, they will meet. To find the cycle start, reset one pointer to head and move both by one step until they meet again.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Linked List Cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'Easy' },
          { title: 'Linked List Cycle II', link: 'https://leetcode.com/problems/linked-list-cycle-ii/', difficulty: 'Medium' },
          { title: 'Middle of the Linked List', link: 'https://leetcode.com/problems/middle-of-the-linked-list/', difficulty: 'Easy' },
          { title: 'Palindrome Linked List', link: 'https://leetcode.com/problems/palindrome-linked-list/', difficulty: 'Easy' },
          { title: 'Happy Number', link: 'https://leetcode.com/problems/happy-number/', difficulty: 'Easy' },
        ]
      },
      {
        id: 'linked-list-reversal',
        name: 'In-Place Reversal',
        explanation: `
          <div class="explanation-section">
            <p><strong>In-Place Reversal</strong> of a linked list reverses node pointers without using extra space. It's a fundamental technique that appears in many linked list problems.</p>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Iterative Approach</h3>
            <p>Use three pointers: <code>prev</code>, <code>curr</code>, <code>next</code>. At each step, save next, reverse curr's pointer to prev, then advance prev and curr.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 Variations</h3>
            <ul>
              <li><strong>Reverse entire list:</strong> Standard iterative/recursive reversal</li>
              <li><strong>Reverse between positions:</strong> Only reverse nodes from position m to n</li>
              <li><strong>Reverse in k-groups:</strong> Reverse every k consecutive nodes</li>
            </ul>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Reverse Linked List', link: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'Easy' },
          { title: 'Reverse Linked List II', link: 'https://leetcode.com/problems/reverse-linked-list-ii/', difficulty: 'Medium' },
          { title: 'Reverse Nodes in k-Group', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', difficulty: 'Hard' },
          { title: 'Swap Nodes in Pairs', link: 'https://leetcode.com/problems/swap-nodes-in-pairs/', difficulty: 'Medium' },
        ]
      }
    ]
  },
  {
    id: 'sorting-searching',
    name: 'Sorting & Searching',
    icon: '⇅',
    description: 'Fundamental algorithms for ordering data and finding elements efficiently.',
    methods: [
      {
        id: 'binary-search',
        name: 'Binary Search',
        explanation: `
          <div class="explanation-section">
            <p><strong>Binary Search</strong> is a divide-and-conquer algorithm that finds a target in a sorted array by repeatedly halving the search space. It's one of the most fundamental and powerful algorithmic techniques.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Searching in a sorted array or rotated sorted array</li>
              <li>Finding boundaries (first/last occurrence)</li>
              <li>Searching in a 2D sorted matrix</li>
              <li>Optimization problems: "find the minimum/maximum value that satisfies a condition"</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Template</h3>
            <p>Set <code>lo = 0</code>, <code>hi = n-1</code>. While <code>lo ≤ hi</code>: compute <code>mid = lo + (hi - lo) / 2</code>. Compare target with <code>arr[mid]</code> and eliminate half the search space.</p>
          </div>
          <div class="explanation-callout">
            <strong>Key Insight</strong>
            Binary search isn't limited to sorted arrays. It applies to any monotonic function — if you can define a predicate that transitions from false to true (or vice versa), you can binary search on it.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(log n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Binary Search', link: 'https://leetcode.com/problems/binary-search/', difficulty: 'Easy' },
          { title: 'Search in Rotated Sorted Array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium' },
          { title: 'Find Minimum in Rotated Sorted Array', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium' },
          { title: 'Search a 2D Matrix', link: 'https://leetcode.com/problems/search-a-2d-matrix/', difficulty: 'Medium' },
          { title: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'Hard' },
          { title: 'Find First and Last Position', link: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'cyclic-sort',
        name: 'Cyclic Sort',
        explanation: `
          <div class="explanation-section">
            <p><strong>Cyclic Sort</strong> is an in-place sorting algorithm optimal for arrays containing numbers in a given range (e.g., 1 to n). The key idea: place each number at its correct index in a single pass.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Arrays containing numbers in range [1, n] or [0, n]</li>
              <li>Finding missing numbers</li>
              <li>Finding duplicate numbers</li>
              <li>Finding the first missing positive</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Iterate through the array. For each element, if it's not at its correct position (<code>arr[i] != i + 1</code>), swap it to its correct position. Repeat until the current element is correct, then move to the next.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Missing Number', link: 'https://leetcode.com/problems/missing-number/', difficulty: 'Easy' },
          { title: 'Find All Numbers Disappeared in an Array', link: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/', difficulty: 'Easy' },
          { title: 'Find the Duplicate Number', link: 'https://leetcode.com/problems/find-the-duplicate-number/', difficulty: 'Medium' },
          { title: 'Find All Duplicates in an Array', link: 'https://leetcode.com/problems/find-all-duplicates-in-an-array/', difficulty: 'Medium' },
          { title: 'First Missing Positive', link: 'https://leetcode.com/problems/first-missing-positive/', difficulty: 'Hard' },
          { title: 'Set Mismatch', link: 'https://leetcode.com/problems/set-mismatch/', difficulty: 'Easy' },
        ]
      },
      {
        id: 'merge-intervals',
        name: 'Merge Intervals',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Merge Intervals</strong> pattern deals with overlapping intervals. Sort by start time, then merge or process intervals by comparing each interval's start with the previous interval's end.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Merging overlapping intervals</li>
              <li>Inserting new intervals</li>
              <li>Finding intersections of interval lists</li>
              <li>Meeting room scheduling problems</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Sort intervals by start time. Initialize result with the first interval. For each subsequent interval: if it overlaps with the last result interval (start ≤ previous end), merge them by extending the end. Otherwise, add as a new interval.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n log n)</code></span>
            <span class="complexity-badge">Space: <code>O(n)</code></span>
          </div>
        `,
        questions: [
          { title: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'Medium' },
          { title: 'Insert Interval', link: 'https://leetcode.com/problems/insert-interval/', difficulty: 'Medium' },
          { title: 'Non-overlapping Intervals', link: 'https://leetcode.com/problems/non-overlapping-intervals/', difficulty: 'Medium' },
          { title: 'Meeting Rooms II', link: 'https://leetcode.com/problems/meeting-rooms-ii/', difficulty: 'Medium' },
          { title: 'Minimum Number of Arrows to Burst Balloons', link: 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/', difficulty: 'Medium' },
        ]
      }
    ]
  },
  {
    id: 'trees',
    name: 'Trees',
    icon: '🌲',
    description: 'Hierarchical data structures. Traversals, BST properties, and recursive patterns.',
    methods: [
      {
        id: 'tree-bfs',
        name: 'BFS (Level Order)',
        explanation: `
          <div class="explanation-section">
            <p><strong>Breadth-First Search</strong> traverses a tree level by level using a queue. Process all nodes at the current depth before moving to the next level.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Level-order traversal</li>
              <li>Finding minimum depth</li>
              <li>Level averages, zigzag traversal</li>
              <li>Connecting nodes at the same level</li>
              <li>Shortest path in unweighted graphs</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Template</h3>
            <p>Push root to queue. While queue is not empty: get current level size, process all nodes at this level, add their children to the queue.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(w)</code> where w = max width</span>
          </div>
        `,
        questions: [
          { title: 'Binary Tree Level Order Traversal', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'Medium' },
          { title: 'Binary Tree Zigzag Level Order Traversal', link: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/', difficulty: 'Medium' },
          { title: 'Minimum Depth of Binary Tree', link: 'https://leetcode.com/problems/minimum-depth-of-binary-tree/', difficulty: 'Easy' },
          { title: 'Average of Levels in Binary Tree', link: 'https://leetcode.com/problems/average-of-levels-in-binary-tree/', difficulty: 'Easy' },
          { title: 'Binary Tree Right Side View', link: 'https://leetcode.com/problems/binary-tree-right-side-view/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'tree-dfs',
        name: 'DFS (Recursive)',
        explanation: `
          <div class="explanation-section">
            <p><strong>Depth-First Search</strong> explores a tree by going as deep as possible along each branch before backtracking. Three classic orderings: <strong>preorder</strong> (root, left, right), <strong>inorder</strong> (left, root, right), <strong>postorder</strong> (left, right, root).</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Path sum problems</li>
              <li>Tree construction from traversals</li>
              <li>Validating BST properties</li>
              <li>Finding LCA (Lowest Common Ancestor)</li>
              <li>Diameter, height, and subtree problems</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Recursive Pattern</h3>
            <p>Base case: if node is null, return. Recursive case: process current node, recurse on left subtree, recurse on right subtree. Adjust the order of processing based on preorder/inorder/postorder needs.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(h)</code> where h = height</span>
          </div>
        `,
        questions: [
          { title: 'Maximum Depth of Binary Tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'Easy' },
          { title: 'Path Sum', link: 'https://leetcode.com/problems/path-sum/', difficulty: 'Easy' },
          { title: 'Validate Binary Search Tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'Medium' },
          { title: 'Lowest Common Ancestor of a BST', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', difficulty: 'Medium' },
          { title: 'Diameter of Binary Tree', link: 'https://leetcode.com/problems/diameter-of-binary-tree/', difficulty: 'Easy' },
          { title: 'Binary Tree Maximum Path Sum', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'Hard' },
          { title: 'Serialize and Deserialize Binary Tree', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', difficulty: 'Hard' },
        ]
      }
    ]
  },
  {
    id: 'graphs',
    name: 'Graphs',
    icon: '◈',
    description: 'Networks of nodes and edges. BFS, DFS, topological sort, and shortest path algorithms.',
    methods: [
      {
        id: 'graph-bfs-dfs',
        name: 'Graph Traversal (BFS/DFS)',
        explanation: `
          <div class="explanation-section">
            <p><strong>Graph Traversal</strong> visits all reachable nodes from a source. BFS explores layer by layer (queue-based), while DFS goes deep first (stack/recursion). Both are essential for connectivity, component counting, and pathfinding.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Connected components / island counting</li>
              <li>Flood fill / grid-based problems</li>
              <li>Shortest path in unweighted graphs (BFS)</li>
              <li>Detecting cycles</li>
              <li>Bipartite checking</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Key Difference</h3>
            <p><strong>BFS</strong> guarantees shortest path in unweighted graphs. <strong>DFS</strong> uses less memory in sparse/deep graphs and is easier to implement recursively. Both visit each node once → O(V + E).</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(V + E)</code></span>
            <span class="complexity-badge">Space: <code>O(V)</code></span>
          </div>
        `,
        questions: [
          { title: 'Number of Islands', link: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium' },
          { title: 'Clone Graph', link: 'https://leetcode.com/problems/clone-graph/', difficulty: 'Medium' },
          { title: 'Pacific Atlantic Water Flow', link: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', difficulty: 'Medium' },
          { title: 'Word Ladder', link: 'https://leetcode.com/problems/word-ladder/', difficulty: 'Hard' },
          { title: 'Rotting Oranges', link: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'topological-sort',
        name: 'Topological Sort',
        explanation: `
          <div class="explanation-section">
            <p><strong>Topological Sort</strong> produces a linear ordering of vertices in a DAG (Directed Acyclic Graph) such that for every edge u → v, vertex u appears before v. Essential for dependency resolution.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Task scheduling with prerequisites</li>
              <li>Course schedule / build order problems</li>
              <li>Detecting cycles in directed graphs</li>
              <li>Compilation order dependencies</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Two Approaches</h3>
            <p><strong>Kahn's Algorithm (BFS):</strong> Compute in-degrees. Enqueue all nodes with in-degree 0. Process queue: for each node, reduce in-degree of neighbors, enqueue when in-degree hits 0.</p>
            <p><strong>DFS-based:</strong> Run DFS, push nodes to result stack in post-order. Reverse for topological order.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(V + E)</code></span>
            <span class="complexity-badge">Space: <code>O(V)</code></span>
          </div>
        `,
        questions: [
          { title: 'Course Schedule', link: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium' },
          { title: 'Course Schedule II', link: 'https://leetcode.com/problems/course-schedule-ii/', difficulty: 'Medium' },
          { title: 'Alien Dictionary', link: 'https://leetcode.com/problems/alien-dictionary/', difficulty: 'Hard' },
          { title: 'Minimum Height Trees', link: 'https://leetcode.com/problems/minimum-height-trees/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'union-find',
        name: 'Union-Find',
        explanation: `
          <div class="explanation-section">
            <p><strong>Union-Find</strong> (Disjoint Set Union) efficiently tracks connected components. It supports two operations: <strong>find</strong> (which component does an element belong to?) and <strong>union</strong> (merge two components).</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Dynamic connectivity queries</li>
              <li>Kruskal's MST algorithm</li>
              <li>Detecting cycles in undirected graphs</li>
              <li>Connected components with dynamic edge additions</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Optimizations</h3>
            <p><strong>Path Compression:</strong> During find, make each node point directly to root → nearly O(1) per operation.</p>
            <p><strong>Union by Rank:</strong> Attach the smaller tree under the root of the larger tree to keep depth minimal.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Amortized: <code>O(α(n))</code> ≈ O(1)</span>
            <span class="complexity-badge">Space: <code>O(n)</code></span>
          </div>
        `,
        questions: [
          { title: 'Number of Connected Components', link: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', difficulty: 'Medium' },
          { title: 'Redundant Connection', link: 'https://leetcode.com/problems/redundant-connection/', difficulty: 'Medium' },
          { title: 'Accounts Merge', link: 'https://leetcode.com/problems/accounts-merge/', difficulty: 'Medium' },
          { title: 'Longest Consecutive Sequence', link: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'Medium' },
        ]
      }
    ]
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    icon: '◻',
    description: 'Solve complex problems by breaking them into overlapping subproblems with optimal substructure.',
    methods: [
      {
        id: 'dp-1d',
        name: '1D DP (Linear)',
        explanation: `
          <div class="explanation-section">
            <p><strong>1D Dynamic Programming</strong> uses a single array to store solutions to subproblems. Each state typically depends on a constant number of previous states.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 Classic Problems</h3>
            <ul>
              <li><strong>Fibonacci-style:</strong> dp[i] = dp[i-1] + dp[i-2]</li>
              <li><strong>Climbing stairs:</strong> Number of ways to reach step i</li>
              <li><strong>House robber:</strong> Maximum sum without adjacent elements</li>
              <li><strong>Coin change:</strong> Minimum coins to make a target</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Framework</h3>
            <p>1. Define the state: what does <code>dp[i]</code> represent?<br/>
            2. Find the recurrence: how does <code>dp[i]</code> relate to previous states?<br/>
            3. Determine base cases<br/>
            4. Decide iteration order and space optimization</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n)</code></span>
            <span class="complexity-badge">Space: <code>O(n)</code> or <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Climbing Stairs', link: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'Easy' },
          { title: 'House Robber', link: 'https://leetcode.com/problems/house-robber/', difficulty: 'Medium' },
          { title: 'Coin Change', link: 'https://leetcode.com/problems/coin-change/', difficulty: 'Medium' },
          { title: 'Longest Increasing Subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'Medium' },
          { title: 'Word Break', link: 'https://leetcode.com/problems/word-break/', difficulty: 'Medium' },
          { title: 'Decode Ways', link: 'https://leetcode.com/problems/decode-ways/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'dp-2d',
        name: '2D DP (Grid/Sequence)',
        explanation: `
          <div class="explanation-section">
            <p><strong>2D Dynamic Programming</strong> uses a 2D table where each cell represents a subproblem defined by two parameters — often two indices, a range, or grid coordinates.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 Common Patterns</h3>
            <ul>
              <li><strong>Grid paths:</strong> dp[i][j] = ways/cost to reach cell (i,j)</li>
              <li><strong>Two sequences:</strong> dp[i][j] = answer using first i chars of s1 and first j chars of s2 (LCS, edit distance)</li>
              <li><strong>Interval DP:</strong> dp[i][j] = answer for subarray from i to j</li>
              <li><strong>Knapsack:</strong> dp[i][w] = best value using first i items with capacity w</li>
            </ul>
          </div>
          <div class="explanation-callout">
            <strong>Space Optimization</strong>
            If dp[i] only depends on dp[i-1], you can reduce space from O(n×m) to O(m) by keeping only two rows.
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n·m)</code></span>
            <span class="complexity-badge">Space: <code>O(n·m)</code> or <code>O(m)</code></span>
          </div>
        `,
        questions: [
          { title: 'Unique Paths', link: 'https://leetcode.com/problems/unique-paths/', difficulty: 'Medium' },
          { title: 'Longest Common Subsequence', link: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'Medium' },
          { title: 'Edit Distance', link: 'https://leetcode.com/problems/edit-distance/', difficulty: 'Medium' },
          { title: '0/1 Knapsack (Partition Equal Subset Sum)', link: 'https://leetcode.com/problems/partition-equal-subset-sum/', difficulty: 'Medium' },
          { title: 'Maximal Square', link: 'https://leetcode.com/problems/maximal-square/', difficulty: 'Medium' },
          { title: 'Regular Expression Matching', link: 'https://leetcode.com/problems/regular-expression-matching/', difficulty: 'Hard' },
          { title: 'Burst Balloons', link: 'https://leetcode.com/problems/burst-balloons/', difficulty: 'Hard' },
        ]
      }
    ]
  },
  {
    id: 'heaps',
    name: 'Heaps & Priority Queues',
    icon: '△',
    description: 'Efficient access to the minimum or maximum element. Top-K patterns and scheduling.',
    methods: [
      {
        id: 'top-k-elements',
        name: 'Top K Elements',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Top K Elements</strong> pattern finds the K largest, smallest, or most frequent elements using a heap. Use a min-heap of size K for top-K largest, or a max-heap of size K for top-K smallest.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>K-th largest/smallest element</li>
              <li>K most frequent elements</li>
              <li>K closest points to origin</li>
              <li>Sorting nearly sorted (K-sorted) arrays</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ Approach</h3>
            <p>For K-th largest: maintain a min-heap of size K. For each element, if heap size < K or element > heap top, push it. If heap size exceeds K, pop. After processing, the heap top is the K-th largest.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Time: <code>O(n log k)</code></span>
            <span class="complexity-badge">Space: <code>O(k)</code></span>
          </div>
        `,
        questions: [
          { title: 'Kth Largest Element in an Array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'Medium' },
          { title: 'Top K Frequent Elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'Medium' },
          { title: 'K Closest Points to Origin', link: 'https://leetcode.com/problems/k-closest-points-to-origin/', difficulty: 'Medium' },
          { title: 'Sort Characters By Frequency', link: 'https://leetcode.com/problems/sort-characters-by-frequency/', difficulty: 'Medium' },
          { title: 'Find K Pairs with Smallest Sums', link: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/', difficulty: 'Medium' },
        ]
      },
      {
        id: 'two-heaps',
        name: 'Two Heaps',
        explanation: `
          <div class="explanation-section">
            <p>The <strong>Two Heaps</strong> pattern uses a max-heap and a min-heap together to efficiently track the median or partition elements into two halves.</p>
          </div>
          <div class="explanation-section">
            <h3>💡 When to Use</h3>
            <ul>
              <li>Finding the median of a data stream</li>
              <li>Sliding window median</li>
              <li>Problems requiring tracking of two partitions</li>
            </ul>
          </div>
          <div class="explanation-section">
            <h3>⚙️ How It Works</h3>
            <p>Max-heap stores the smaller half, min-heap stores the larger half. Keep them balanced (sizes differ by at most 1). Median is always at the top of one or both heaps.</p>
          </div>
          <div class="complexity-badges">
            <span class="complexity-badge">Insert: <code>O(log n)</code></span>
            <span class="complexity-badge">Median: <code>O(1)</code></span>
          </div>
        `,
        questions: [
          { title: 'Find Median from Data Stream', link: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'Hard' },
          { title: 'Sliding Window Median', link: 'https://leetcode.com/problems/sliding-window-median/', difficulty: 'Hard' },
          { title: 'IPO', link: 'https://leetcode.com/problems/ipo/', difficulty: 'Hard' },
        ]
      }
    ]
  }
];
