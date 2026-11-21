class Sort {
    static void bubbleSort(int[] a) {                     // @a bb.sig
        int n = a.length;
        for (int i = 0; i < n - 1; i++) {                 // @a bb.pass
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                if (a[j] > a[j + 1]) {                    // @a bb.cmp
                    int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;  // @a bb.swap
                    swapped = true;
                }
            }
            if (!swapped) break;                          // @a bb.early
        }
    }
}
