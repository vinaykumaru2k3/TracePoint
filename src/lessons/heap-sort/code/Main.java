class HeapSort {
    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    static void heapSort(int[] a) {                   // @a sort.sig
        int n = a.length;
        for (int i = n / 2 - 1; i >= 0; i--)          // @a build.loop
            siftDown(a, i, n);                        // @a build.loop
        for (int end = n - 1; end > 0; end--) {       // @a out.loop
            swap(a, 0, end);                          // @a out.swap
            siftDown(a, 0, end);                      // @a out.sift
        }
    }

    // Max-heap sift-down inside a[0..size).
    static void siftDown(int[] a, int i, int size) {
        while (true) {
            int l = 2 * i + 1, r = l + 1, m = i;      // @a sift.cmp
            if (l < size && a[l] > a[m]) m = l;       // @a sift.cmp
            if (r < size && a[r] > a[m]) m = r;       // @a sift.cmp
            if (m == i) return;                       // @a sift.stop
            swap(a, i, m);                            // @a sift.swap
            i = m;                                    // @a sift.swap
        }
    }
}
