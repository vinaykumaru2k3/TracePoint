class Sort {
    static void quickSort(int[] a, int lo, int hi) {      // @a qs.sig
        if (lo >= hi) return;                             // @a qs.base
        int pivot = a[hi], i = lo - 1;                    // @a qs.pivot
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) {                           // @a qs.cmp
                i++;
                int t = a[i]; a[i] = a[j]; a[j] = t;      // @a qs.swap
            }
        }
        int t = a[i + 1]; a[i + 1] = a[hi]; a[hi] = t;    // @a qs.place
        quickSort(a, lo, i);
        quickSort(a, i + 2, hi);
    }
}
