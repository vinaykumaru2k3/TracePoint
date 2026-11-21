class Floyd {
    static class Node { int val; Node next; Node(int v) { val = v; } }

    static boolean hasCycle(Node head) {            // @a fs.sig
        Node slow = head, fast = head;              // @a fs.init
        while (fast != null && fast.next != null) { // @a fs.loop
            slow = slow.next;                       // @a fs.slow
            fast = fast.next.next;                  // @a fs.fast
            if (slow == fast) return true;          // @a fs.meet
        }
        return false;                               // @a fs.none
    }
}
