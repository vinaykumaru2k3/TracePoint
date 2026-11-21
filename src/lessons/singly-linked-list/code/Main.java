class SinglyLinkedList {
    static class Node { int val; Node next; Node(int v) { val = v; } }
    private Node head, tail;

    void addFirst(int x) {                          // @a addFirst.sig
        Node n = new Node(x);                       // @a addFirst.new
        n.next = head;                              // @a addFirst.link
        head = n;                                   // @a addFirst.head
        if (tail == null) tail = n;
    }

    void addLast(int x) {                           // @a addLast.sig
        Node n = new Node(x);                       // @a addLast.new
        if (tail == null) { head = tail = n; return; } // @a addLast.empty
        tail.next = n;                              // @a addLast.link
        tail = n;                                   // @a addLast.tail
    }

    boolean contains(int x) {                       // @a contains.sig
        for (Node cur = head; cur != null; cur = cur.next) // @a contains.walk
            if (cur.val == x) return true;          // @a contains.hit
        return false;                               // @a contains.miss
    }

    boolean delete(int x) {                         // @a delete.sig
        Node prev = null, cur = head;
        while (cur != null && cur.val != x) { prev = cur; cur = cur.next; } // @a delete.walk
        if (cur == null) return false;              // @a delete.miss
        if (prev == null) head = cur.next;          // @a delete.head
        else prev.next = cur.next;                  // @a delete.unlink
        if (cur == tail) tail = prev;               // @a delete.tail
        return true;
    }
}
