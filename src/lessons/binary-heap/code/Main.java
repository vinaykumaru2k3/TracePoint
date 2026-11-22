class MinHeap {
    int[] a = new int[16];
    int size = 0;

    void swap(int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    void push(int v) {                              // @a push.sig
        a[size] = v;                                // @a push.add
        int i = size++;                             // @a push.add
        while (i > 0) {
            int p = (i - 1) / 2;                    // @a up.cmp
            if (a[p] <= a[i]) break;                // @a up.stop
            swap(i, p);                             // @a up.swap
            i = p;                                  // @a up.swap
        }
    }

    Integer pop() {                                 // @a pop.sig
        if (size == 0) return null;                 // @a pop.empty
        int top = a[0];                             // @a pop.take
        a[0] = a[--size];                           // @a pop.last
        int i = 0;
        while (true) {
            int l = 2 * i + 1, r = l + 1, m = i;    // @a down.cmp
            if (l < size && a[l] < a[m]) m = l;     // @a down.cmp
            if (r < size && a[r] < a[m]) m = r;     // @a down.cmp
            if (m == i) break;                      // @a down.stop
            swap(i, m);                             // @a down.swap
            i = m;                                  // @a down.swap
        }
        return top;                                 // @a pop.ret
    }
}
