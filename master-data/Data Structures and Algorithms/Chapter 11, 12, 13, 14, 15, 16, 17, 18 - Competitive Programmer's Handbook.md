---
title: Chapter 11, 12, 13, 14, 15, 16, 17, 18 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-19
status: inprogress
description: Graphs, Graph traversal, Shortest paths, Trees, Spanning trees, Directed graphs, Connectivity, Tree queries.
---

# Graph terminology

Graph consists of nodes and edges.

Path from node `a` to node `b` has length equals to number of edges in it.

Graph is **connected** if there is a path between any two nodes.

Connected parths of a graph are called its **components**.

**Tree** is a connected graph that consists of `n` nodes and `n-1` edges.

Graph is **regular** if the degree of every node is a constant **d**.

Graph is **complete** if the degree of every node is `n-1`.

**Indegree** of a node is the number of edges that end at the node,
**outdegree** of a node is the number of edges that start at the node.

Graph is **bipartite** if it is possible to color it using two colors. 
Graph is bipartite exactly when it does not contain a cycle with an odd number of edges.

Graph is **simple** if there are no self loops.

# Graph representation

1. Adjacency list representation
2. Adjacency matrix representation
3. Edge list representation

# Graph traversal

DFS and BFS both are given starting node in the graph, and they visit all nodes that can be 
reached from given starting node, the difference in the algorithms is the order in which they 
visit the nodes.

Time complexity: $$ O(n+m) $$, where `n` is the number of nodes and `m` is the number of edges.

# Applications

1. Connectivity check: we can check if a graph is connected by starting at an arbitrary node and
finding out if we can reach all other nodes.

3. Finding cycles: if during graph traversal we find a node whose neighbor has already been visisted
there is a cycle.

5. Bipartiteness check: if graph contains cycle of odd length it cannot be bipartite.

# Shortest paths

## Bellman-Ford algorithm

Key idead is that any shortest path can have at most `n-1` edges, and order of relaxations of edges 
do not impact the solution.

We can relax all the edges and repeat this for `n-1` times, at the end we will have shortest paths from
given node to all nodes.

If graph can be relaxed further after `n-1` times, there must be reachable negative cycle.

Time complexity: $$ O(nm) $$

### SPFA algorithm - Shortest path faste algorithm

It is a variant of Bellman-Ford algorithm, it does not go through all the edges on each round,
but chooses the edges to be examined in a more intelligent way.

It maintains a queue of nodes that might be used for reducing the distances, initially only 
starting node is added to the queue, then the algorithm always processes the first node in the queue,
and when edge is reduces a distance, end node is added to the queue.

Time complexity: $$ O(nm) $$

## Dijkstra's algorithm

Calculates shortest paths from starting node to all the nodes.

It requires that there are no negative weigth edges.

It is efficient as it only processes each edge once.

Initially distance to the starting node is 0 and all other nodes is infinite.
At each step, Dijkstra's algorithm selects a node that has not been processed yet and whose distance
is as small as possible, when a node is selected, algorithm goes through all edges that start at that
node and relaxes them.

Whenever a node is selected its distance is final.

Maintains priority queue to track nearest nodes.

Time complexity: $$O (n + m log m) $$

## Floyd-Warshall algorithm

Finds all shortest paths between the nodes in a single run.

It keeps 2-D array to track shortest distances, initial distances are measured by weights of direct 
edges, then at each step intermediate nodes are considered for relaxation.

Time complexity: $$ O (n ^ 3) $$

# Trees

Tree is a connected acyclic graph that consists of `n` nodes and `n-1` edges, removing any edge 
divides it into two components, and adding any edge creates a cycle.

Leaves of a tree are the nodes with degree 1.

In rooted trees, one nodes is appointed the root of the tree, and all other nodes are placed 
underneath the root.

# Diameter

Diameter of a tree is the maximum length of a path between two nodes.

## Algorithm 1

Key observation is that every longest path has the highest node, thus we can calculate for each node
the length of the longest path whose highest node is the node. One of those paths corresponds to the 
diameter of the tree.

Calculate for each node `x` two values:

1. maximum length of a path from node to any leaf.

2. maximum length of a path whose highest point is the node.

## Algorithm 2

Efficient way is to run DFS twice.

First pick any arbitrary node `a`, run dfs from there to find the farthest node `b`, then run dfs
from `b` to find farthest node `c`. Now path from `b` to `c` is the longest path.

This approach restructure the whole problem, consider longest path completely horizontal and 
all other nodes are just hanging on them.

# All longest paths

Calculate for every node in the tree the maximum length of a path that begins at the node.

First part of the problem is to calculate for every node `x` the maximum length of a path that goes
through a child of `x`.

Second part of the problem is to calculate for every node `x` the maximum length of a path through 
its parent `p`. 

Second part can be solved efficiently in $$O(n)$$ time by storing two maximum lengths for each 
node x: 

1. maximum length of a path from `x`.

2. maximum length of a path from `x` in another direction than the first path.

# Binary trees

Binary tree is a rooted tree, where each node have at most 2 children nodes.

Nodes of a binary tree have three natural ordering that corresponds to different ways to recursively
traverse the tree

1. pre-order: root, left subtree, right subtree
2. in-order: left subtree, root, right subtree
3. post-order: left subtree, right subtree, root

To construct unique binary tree from traversal either

1. pre-order and in-order or
2. post-order and in-order traversal are needed.

# Spanning trees

Spanning tree of a graph consists of all nodes of the graph and some of the edges of the graph so 
that there is a path between any two nodes.

Spanning trees are connected and acyclic graphs.

Minimum spanning tree is a spanning tree whose weight is as small as possible.

## Kruskal's algorithm

Initial spanning tree contains all the nodes of the graph and does not contain any edge.

Then algorithm goes through the edges ordered by their weights, and always adds an edge to the 
tree if it does not create a cycle.

It maintains the components of the graph initially each nodes belongs to a separate component of
their own, as edge is added it connects two separate components into one. Ultimately all nodes
belongs to single component - and that is minimum spanning tree.

Its implementation requires two operations
1. to check if nodes belongs to the same component or not
2. to unite separate components into one

Union-find structure provides both of these operations in `O(log n)` time complexity.

## Prim's algorithm

Choose an arbitrary node.

Always choose a minimum weight edge that adds a new node to the tree.

Finally, all nodes have been added to the tree and minimum spanning tree has been found.

It can be efficiently implemented by priority queue. Priority queue should contain all nodes that 
can be connected to the current component using a single edge, in increasing order of the edge
weight.

Both Kruskal's and Prim's algorithm runs in `O(n + m log m)` time complexity.

# Directed graphs

Acyclic graph: there are not cycles in the graph

Successor graph: outdegree of each node is 1, so each node has a unique successor.

## Topological sorting

It is an ordering of the nodes of a acyclic directed graph such that if there is a path from node 
a to node b then node a appears before node b in the ordering.

DFS can be used to both check if cycle is present, and if not, to construct a topological sort.

Node can be in three states: 
1. state 0: node has not been processed - white
2. state 1: node is being processed - gray
3. state 2: node has been processed - black

If the graph contains a cycle, during the search we will encounter gray node.

During search we maintain a list of nodes, and add node that are processed are added to the end of 
the list, this list in reverse order is topological sort.

Any dynamic programming problem can be represented as a directed acyclic graph, each node
corresponds to a dynamic programming state and the edges indicate how the states depend on each 
other.

## Successor paths

Successor graphs are sometimes called functional graphs - reason is that any successor graph 
corresponds to a function that defines the edges of the graph. The parameter for the function is a 
node of the graph and the function gives the successor of the that node.


## Cycle detection

## Floyd's algorithm

It walks forward in the graph using two pointers a and b. Both begins at a node x that is starting 
node of the graph. Then on each turn pointer a walks one step forward and pointer b walks two 
steps forward. Process continues till both pointers meet each other.

By this time, a has walked k steps, b has walked 2k steps, so cycle length divides k.

Thus the first node that belongs to the cycle can be found by moving the pointer a to node x and 
advancing the pointers step by step until they meet again.

# Strong connectivity

In a directed graph edges can only be traversed in one direction, so even if the graph is 
connected it is not guaranteed that any two nodes will have path between them.

Graph is strongly connected if there a path from any node to all other nodes in the graph.

Strongly connected components of a graph divide the graph into strongly connected components that 
are as large as possible. The strongly connected components form an acyclic component graph that
represents the deep structure of the original graph.

## Kosaraju's algorithm

Performs two DFS to find strongly connected components of the graph.

### Search 1

Construct a list of nodes in the order in which a depth-first search processes them.

### Search 2

Reverse all the edges, process list of nodes created by the first search in reverse order.

If nodes does not belong to a component, the algorithm creates a new component and starts a DFS 
that adds all new nodes found during the search to the new component.

## 2SAT problem

$$
(a_1 \lor b_1) \land (a_2 \lor b_2) \land \cdots \land (a_m \lor b_m)
$$

Each $$a_i$$ and $$b_i$$ is either a logical variable or negation of logical variable.

This problem can be represented as a graph whose nodes correspond to variables $$x_i$$ and
negations $$\neg x_i$$. Each pair $$a_i \lor b_i$$ generates two edges: 
$$\neg a_i \rightarrow b_i \quad$$ 
and 
$$\quad \neg b_i \rightarrow a_i$$

This means at least one of $$a_i$$ or $$b_i$$ must hold.

Structure of this graph tells us whether it is possible to assign the values of the variable 
so that the formula is true.

This can be done exactly when there are no nodes $$x_i$$  and $$\neg x_i$$ such that both nodes 
belongs to the same strongly connected component.

# Tree queries

## Finding ancestors

Easy way to find $$k$$th successor is to move $$k$$ times up the tree. But it has time complexity 
$$O(n)$$.

Efficient way is to have all values precomputed, where $$k \le n$$ is a power of 2. This 
preprocessing takes $$O(n log n)$$ time. After this any query can be answered in $$O(log k)$$ time,
by representing $$k$$ as sum of powers of 2.

## Subtrees and paths

A `tree traversal array` contains the nodes of a rooted tree in the order in which a DFS from the 
root node visits them.

### Subtree queries

Each subtree of a tree corresponds to a subarray of the tree traversal array such that the first
element of the subarray is the root node. This fact can be used to answer queries that are 
related to subtrees of a tree.

Consider a problem where each node is assigned a value, and our task is to support the following
queries:
1. Update the value of a node
2. Calculate the sum of values in the subtree of a node.

Key idea is to construct a tree traversal array that contains three values for each node:
identifier of the node, the size of the subtree, and the value of the node.

Now to answer the queries efficiently, it suffices to store the values of the nodes in a binary
indexed or segment tree. After this both operations can be performed in $$O(log n)$$ time.

### Path queries

Consider following queries
1. change the value of a node
2. calculate the sum of values on a path from the root to a node

This problem can be solved by constructing tree traversal array that stores node identifier, 
subtree size and path sum from root to node.

When the value of root is updated, values of all the nodes of the subtree has to be updated as 
well.

Fenwick or Segment tree can be used to manage this information in $$O(log n))$$ time.

## Lowest common ancestor

LCA of two nodes of a rooted tree is the lowest node whose subtree contains both the nodes.

## Method 1

Have two pointers pointing at nodes in the question, mode lower level point upwards until both
are on the same level. Then move both of them until they meet on the same node - that node is 
thier LCA.

## Method 2

Run DFS from root and maintain traversal array but this time, instead of adding node only first 
time, add it into the list for each visit, along with its depth.

Now to find the LCS of node a and node b, find node with minimum depth between node a and node b
in the array.

Thus if suffices to process a range minimum query.

Similarly distances of nodes can be processed by adding both nodes depth and then subtracting
depth of thier LCA.

