import java.util.*;

class Node { int val; Node left, right; }

class Traversals {
    static void preorder(Node n, List<Integer> out) {       // @a pre.sig
        if (n == null) return;
        out.add(n.val);                                     // @a pre.visit
        preorder(n.left, out);
        preorder(n.right, out);
    }

    static void inorder(Node n, List<Integer> out) {        // @a in.sig
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);                                     // @a in.visit
        inorder(n.right, out);
    }

    static void postorder(Node n, List<Integer> out) {      // @a post.sig
        if (n == null) return;
        postorder(n.left, out);
        postorder(n.right, out);
        out.add(n.val);                                     // @a post.visit
    }

    static List<Integer> levelOrder(Node root) {            // @a lvl.sig
        List<Integer> out = new ArrayList<>();
        Deque<Node> q = new ArrayDeque<>();
        if (root != null) q.add(root);                      // @a lvl.init
        while (!q.isEmpty()) {
            Node n = q.poll();                              // @a lvl.poll
            out.add(n.val);                                 // @a lvl.visit
            if (n.left != null) q.add(n.left);              // @a lvl.push
            if (n.right != null) q.add(n.right);            // @a lvl.push
        }
        return out;                                         // @a lvl.done
    }
}
