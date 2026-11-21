class ArrayDeque6 {
    private int[] data = new int[6];
    private int head = 0, size = 0;

    void pushFront(int x) {                             // @a pushFront.sig
        if (size == data.length)                        // @a pushFront.check
            throw new IllegalStateException("full");
        head = (head - 1 + data.length) % data.length;  // @a pushFront.move
        data[head] = x;                                 // @a pushFront.write
        size++;
    }

    void pushBack(int x) {                              // @a pushBack.sig
        if (size == data.length)                        // @a pushBack.check
            throw new IllegalStateException("full");
        data[(head + size) % data.length] = x;          // @a pushBack.write
        size++;
    }

    int popFront() {                                    // @a popFront.sig
        if (size == 0)                                  // @a popFront.check
            throw new NoSuchElementException();
        int x = data[head];
        head = (head + 1) % data.length;                // @a popFront.move
        size--;
        return x;
    }

    int popBack() {                                     // @a popBack.sig
        if (size == 0)                                  // @a popBack.check
            throw new NoSuchElementException();
        int x = data[(head + size - 1) % data.length];  // @a popBack.read
        size--;
        return x;
    }
}
