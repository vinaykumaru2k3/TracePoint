class DoublyLinkedList {
    static class Node { int val; Node prev, next; Node(int v) { val = v; } }
    private Node head, tail;

    void addFirst(int x) {                          // @a addFirst.sig
        Node n = new Node(x);                       // @a addFirst.new
        n.next = head;                              // @a addFirst.link
        if (head != null) head.prev = n; else tail = n; // @a addFirst.back
        head = n;                                   // @a addFirst.head
    }

    void addLast(int x) {                           // @a addLast.sig
        Node n = new Node(x);                       // @a addLast.new
        n.prev = tail;                              // @a addLast.link
        if (tail != null) tail.next = n; else head = n; // @a addLast.back
        tail = n;                                   // @a addLast.tail
    }

    int removeFirst() {                             // @a removeFirst.sig
        if (head == null)                           // @a removeFirst.check
            throw new NoSuchElementException();
        int x = head.val;
        head = head.next;                           // @a removeFirst.move
        if (head != null) head.prev = null; else tail = null; // @a removeFirst.cut
        return x;
    }

    int removeLast() {                              // @a removeLast.sig
        if (tail == null)                           // @a removeLast.check
            throw new NoSuchElementException();
        int x = tail.val;
        tail = tail.prev;                           // @a removeLast.move
        if (tail != null) tail.next = null; else head = null; // @a removeLast.cut
        return x;
    }
}
