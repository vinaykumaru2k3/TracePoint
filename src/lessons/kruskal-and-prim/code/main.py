import heapq

def kruskal(n, edges):                            # edges = [(w, u, v), ...]   # @a kr.sig
    edges.sort()                                  # @a kr.sort
    uf = UnionFind(n)                             # from the union-find lesson
    tree, total = [], 0
    for w, u, v in edges:
        if len(tree) == n - 1:
            break
        if uf.find(u) == uf.find(v):              # @a kr.find
            continue                              # @a kr.skip
        uf.union(u, v)
        tree.append((u, v))                       # @a kr.take
        total += w
    return total, tree                            # @a kr.done

def prim(adj, s):                                 # adj[u] = [(x, w), ...]   # @a pr.sig
    in_tree = [False] * len(adj)
    in_tree[s] = True
    heap = [(w, s, x) for x, w in adj[s]]         # @a pr.init
    heapq.heapify(heap)
    tree, total = [], 0
    while heap and len(tree) < len(adj) - 1:
        w, u, v = heapq.heappop(heap)             # @a pr.pop
        if in_tree[v]:
            continue                              # @a pr.skip
        in_tree[v] = True
        tree.append((u, v))                       # @a pr.take
        total += w
        for x, wx in adj[v]:
            if not in_tree[x]:
                heapq.heappush(heap, (wx, v, x))
    return total, tree                            # @a pr.done
