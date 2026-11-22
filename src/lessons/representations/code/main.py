class Graph:
    def __init__(self, n):
        self.adj = [[] for _ in range(n)]           # one list per node
        self.m = [[0] * n for _ in range(n)]        # n x n grid of 0s

    def add_edge(self, u, v):                       # @a add.sig
        self.adj[u].append(v)                       # @a add.uv
        self.adj[v].append(u)                       # @a add.vu
        self.m[u][v] = self.m[v][u] = 1             # @a add.mat

    def has_edge_matrix(self, u, v):                # @a has.mat
        return self.m[u][v] == 1

    def has_edge_list(self, u, v):                  # @a has.sig
        for x in self.adj[u]:                       # @a has.step
            if x == v:
                return True                         # @a has.hit
        return False                                # @a has.miss

    def neighbours(self, u):                        # @a nbr.sig
        out = []
        for x in self.adj[u]:                       # @a nbr.step
            out.append(x)
        return out                                  # @a nbr.done

    def neighbours_matrix(self, u):                 # @a nbr.mat
        return [j for j in range(len(self.m)) if self.m[u][j]]
