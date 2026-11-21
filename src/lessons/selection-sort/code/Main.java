class Sort {
    static void selectionSort(int[] a) {                  // @a sl.sig
        int n = a.length;
        for (int i = 0; i < n - 1; i++) {
            int m = i;                                    // @a sl.outer
            for (int j = i + 1; j < n; j++) {
                if (a[j] < a[m])                          // @a sl.cmp
                    m = j;                                // @a sl.min
            }
            if (m != i) { int t = a[i]; a[i] = a[m]; a[m] = t; }  // @a sl.swap
        }
    }
}
