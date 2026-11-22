class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))              # every node starts as its own root
        self.size = [1] * n

    def find(self, x):                            # @a find.sig
        root = x
        while self.parent[root] != root:          # @a find.root
            root = self.parent[root]              # @a find.hop
        while x != root:                          # path compression
            nxt = self.parent[x]
            self.parent[x] = root                 # @a find.link
            x = nxt
        return root                               # @a find.ret

    def union(self, a, b):                        # @a union.sig
        ra, rb = self.find(a), self.find(b)       # @a union.find
        if ra == rb:
            return False                          # @a union.same
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra                       # @a union.swap
        self.parent[rb] = ra                      # @a union.link
        self.size[ra] += self.size[rb]
        return True

    def connected(self, a, b):                    # @a conn.sig
        return self.find(a) == self.find(b)       # @a conn.ret
