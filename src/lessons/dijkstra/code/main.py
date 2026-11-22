import heapq

# adj[u] holds (x, w) pairs
def dijkstra(adj, s):                             # @a dij.sig
    dist = [float("inf")] * len(adj)
    dist[s] = 0
    pq = [(0, s)]                                 # @a dij.init
    while pq:
        d, u = heapq.heappop(pq)                  # @a dij.pop
        if d > dist[u]:
            continue                              # @a dij.stale
        for x, w in adj[u]:
            if d + w >= dist[x]:                  # @a dij.relax
                continue                          # @a dij.keep
            dist[x] = d + w
            heapq.heappush(pq, (dist[x], x))      # @a dij.push
    return dist                                   # @a dij.done
