---
title: Chapter 11, 12, 13, 14, 15 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-19
status: finished
description: Graphs, Graph traversal, Shortest paths, Trees, Spanning trees
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

