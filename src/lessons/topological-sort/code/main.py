from collections import deque

def topo_sort(adj):                               # @a topo.sig
    indeg = [0] * len(adj)
    for u in range(len(adj)):
        for x in adj[u]:
            indeg[x] += 1                         # @a topo.count
    q = deque(u for u in range(len(adj)) if indeg[u] == 0)   # @a topo.init
    order = []
    while q:
        u = q.popleft()                           # @a topo.poll
        order.append(u)                           # @a topo.out
        for x in adj[u]:
            indeg[x] -= 1                         # @a topo.dec
            if indeg[x] == 0:
                q.append(x)                       # @a topo.push
    if len(order) < len(adj):
        return None                               # @a topo.cycle
    return order                                  # @a topo.done
