class UnionFind {
    int[] parent, size;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }   // every node starts as its own root
    }

    int find(int x) {                                  // @a find.sig
        int root = x;
        while (parent[root] != root)                   // @a find.root
            root = parent[root];                       // @a find.hop
        while (x != root) {                            // path compression
            int next = parent[x];
            parent[x] = root;                          // @a find.link
            x = next;
        }
        return root;                                   // @a find.ret
    }

    boolean union(int a, int b) {                      // @a union.sig
        int ra = find(a), rb = find(b);                // @a union.find
        if (ra == rb) return false;                    // @a union.same
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }   // @a union.swap
        parent[rb] = ra;                               // @a union.link
        size[ra] += size[rb];
        return true;
    }

    boolean connected(int a, int b) {                  // @a conn.sig
        return find(a) == find(b);                     // @a conn.ret
    }
}
