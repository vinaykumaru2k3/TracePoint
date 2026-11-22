class Node { int val, h = 1; Node left, right; Node(int v) { val = v; } }

class AVL {
    int h(Node n) { return n == null ? 0 : n.h; }
    int bf(Node n) { return h(n.left) - h(n.right); }   // balance factor

    Node rotateRight(Node z) {
        Node y = z.left;                                  // @a rot.r
        z.left = y.right;                                 // @a rot.r
        y.right = z;                                      // @a rot.r
        z.h = 1 + Math.max(h(z.left), h(z.right));
        y.h = 1 + Math.max(h(y.left), h(y.right));
        return y;
    }

    Node rotateLeft(Node z) {
        Node y = z.right;                                 // @a rot.l
        z.right = y.left;                                 // @a rot.l
        y.left = z;                                       // @a rot.l
        z.h = 1 + Math.max(h(z.left), h(z.right));
        y.h = 1 + Math.max(h(y.left), h(y.right));
        return y;
    }

    Node insert(Node n, int v) {                          // @a ins.sig
        if (n == null) return new Node(v);                // @a ins.leaf
        if (v < n.val) n.left = insert(n.left, v);        // @a ins.cmp
        else if (v > n.val) n.right = insert(n.right, v); // @a ins.cmp
        else return n;                                    // @a ins.dup
        n.h = 1 + Math.max(h(n.left), h(n.right));        // @a fix.h
        int b = bf(n);                                    // @a fix.bf
        if (b > 1 && v < n.left.val) return rotateRight(n);                    // @a case.ll
        if (b < -1 && v > n.right.val) return rotateLeft(n);                   // @a case.rr
        if (b > 1) { n.left = rotateLeft(n.left); return rotateRight(n); }     // @a case.lr
        if (b < -1) { n.right = rotateRight(n.right); return rotateLeft(n); }  // @a case.rl
        return n;                                         // @a ins.ret
    }
}
