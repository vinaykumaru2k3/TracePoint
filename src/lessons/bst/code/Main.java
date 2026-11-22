class Node { int val; Node left, right; Node(int v) { val = v; } }

class BST {
    Node root;

    boolean insert(int v) {                                   // @a ins.sig
        if (root == null) { root = new Node(v); return true; }  // @a ins.root
        Node cur = root;
        while (true) {
            if (v == cur.val) return false;                   // @a ins.dup
            if (v < cur.val) {                                // @a ins.cmp
                if (cur.left == null) { cur.left = new Node(v); return true; }    // @a ins.attach
                cur = cur.left;
            } else {
                if (cur.right == null) { cur.right = new Node(v); return true; }  // @a ins.attach
                cur = cur.right;
            }
        }
    }

    boolean search(int v) {                                   // @a find.sig
        Node cur = root;
        while (cur != null) {
            if (v == cur.val) return true;                    // @a find.hit
            cur = v < cur.val ? cur.left : cur.right;         // @a find.step
        }
        return false;                                         // @a find.miss
    }

    Node delete(Node n, int v) {                              // @a del.sig
        if (n == null) return null;                           // @a del.miss
        if (v < n.val) n.left = delete(n.left, v);            // @a del.step
        else if (v > n.val) n.right = delete(n.right, v);     // @a del.step
        else {
            if (n.left == null && n.right == null) return null;  // @a del.leaf
            if (n.left == null) return n.right;               // @a del.one
            if (n.right == null) return n.left;               // @a del.one
            Node s = n.right;                                 // @a del.succ
            while (s.left != null) s = s.left;                // @a del.succ
            n.val = s.val;                                    // @a del.copy
            n.right = delete(n.right, s.val);                 // @a del.drop
        }
        return n;
    }
}
