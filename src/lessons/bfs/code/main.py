from collections import deque

def bfs(adj, s):                                  # @a bfs.sig
    dist = [-1] * len(adj)                        # -1 means not seen yet
    dist[s] = 0
    q = deque([s])                                # @a bfs.init
    while q:
        u = q.popleft()                           # @a bfs.poll
        for x in adj[u]:
            if dist[x] != -1:
                continue                          # @a bfs.seen
            dist[x] = dist[u] + 1                 # @a bfs.new
            q.append(x)                           # @a bfs.push
    return dist                                   # @a bfs.done
