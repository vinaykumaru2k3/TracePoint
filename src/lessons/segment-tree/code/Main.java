class SegmentTree {
    int n;
    int[] t;

    SegmentTree(int[] a) {
        n = a.length;
        t = new int[4 * n];                       // t[1] is the root
        build(a, 1, 0, n - 1);                    // @a build
    }

    void build(int[] a, int node, int l, int r) {
        if (l == r) {                             // @a build.leaf
            t[node] = a[l];                       // @a build.leaf
            return;                               // @a build.leaf
        }
        int mid = (l + r) / 2;                    // @a build.split
        build(a, 2 * node, l, mid);               // @a build.split
        build(a, 2 * node + 1, mid + 1, r);       // @a build.split
        t[node] = t[2 * node] + t[2 * node + 1];  // @a build.sum
    }

    int sum(int l, int r) {
        return query(1, 0, n - 1, l, r);          // @a ask
    }

    int query(int node, int nl, int nr, int l, int r) {
        if (r < nl || nr < l) {                   // @a query.out
            return 0;                             // @a query.out
        }
        if (l <= nl && nr <= r) {                 // @a query.in
            return t[node];                       // @a query.in
        }
        int mid = (nl + nr) / 2;                  // @a query.split
        return query(2 * node, nl, mid, l, r)     // @a query.split
             + query(2 * node + 1, mid + 1, nr, l, r);  // @a query.split
    }

    void update(int i, int v) {
        set(1, 0, n - 1, i, v);                   // @a tell
    }

    void set(int node, int l, int r, int i, int v) {
        if (l == r) {                             // @a update.leaf
            t[node] = v;                          // @a update.leaf
            return;                               // @a update.leaf
        }
        int mid = (l + r) / 2;                    // @a update.split
        if (i <= mid) {                           // @a update.split
            set(2 * node, l, mid, i, v);          // @a update.split
        } else {                                  // @a update.split
            set(2 * node + 1, mid + 1, r, i, v);  // @a update.split
        }                                         // @a update.split
        t[node] = t[2 * node] + t[2 * node + 1];  // @a update.fix
    }
}
