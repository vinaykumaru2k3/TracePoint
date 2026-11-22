def dfs(adj, u, seen, order):                     # @a dfs.sig
    seen[u] = True
    order.append(u)                               # @a dfs.visit
    for x in adj[u]:
        if seen[x]:
            continue                              # @a dfs.seen
        dfs(adj, x, seen, order)                  # @a dfs.recurse
    return                                        # @a dfs.done

def visit_from(adj, s):
    seen, order = [False] * len(adj), []
    dfs(adj, s, seen, order)
    return order                                  # @a dfs.order
