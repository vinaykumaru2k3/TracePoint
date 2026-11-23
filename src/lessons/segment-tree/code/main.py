class SegmentTree:
    def __init__(self, a):
        self.n = len(a)
        self.t = [0] * (4 * self.n)               # t[1] is the root
        self.build(a, 1, 0, self.n - 1)           # @a build

    def build(self, a, node, l, r):
        if l == r:                                # @a build.leaf
            self.t[node] = a[l]                   # @a build.leaf
            return                                # @a build.leaf
        mid = (l + r) // 2                        # @a build.split
        self.build(a, 2 * node, l, mid)           # @a build.split
        self.build(a, 2 * node + 1, mid + 1, r)   # @a build.split
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]  # @a build.sum

    def sum(self, l, r):
        return self.query(1, 0, self.n - 1, l, r) # @a ask

    def query(self, node, nl, nr, l, r):
        if r < nl or nr < l:                      # @a query.out
            return 0                              # @a query.out
        if l <= nl and nr <= r:                   # @a query.in
            return self.t[node]                   # @a query.in
        mid = (nl + nr) // 2                      # @a query.split
        return (self.query(2 * node, nl, mid, l, r)           # @a query.split
                + self.query(2 * node + 1, mid + 1, nr, l, r))  # @a query.split

    def update(self, i, v):
        self.set(1, 0, self.n - 1, i, v)          # @a tell

    def set(self, node, l, r, i, v):
        if l == r:                                # @a update.leaf
            self.t[node] = v                      # @a update.leaf
            return                                # @a update.leaf
        mid = (l + r) // 2                        # @a update.split
        if i <= mid:                              # @a update.split
            self.set(2 * node, l, mid, i, v)      # @a update.split
        else:                                     # @a update.split
            self.set(2 * node + 1, mid + 1, r, i, v)  # @a update.split
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]  # @a update.fix
