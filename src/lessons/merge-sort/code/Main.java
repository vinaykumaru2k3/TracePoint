class Sort {
    static void mergeSort(int[] a, int l, int r) {        // @a ms.sig
        if (l >= r) return;                               // @a ms.base
        int m = (l + r) / 2;                              // @a ms.split
        mergeSort(a, l, m);
        mergeSort(a, m + 1, r);
        int[] tmp = new int[r - l + 1];
        int i = l, j = m + 1, k = 0;
        while (i <= m && j <= r) {
            if (a[i] <= a[j]) tmp[k++] = a[i++];          // @a ms.cmp
            else tmp[k++] = a[j++];                       // @a ms.take
        }
        while (i <= m) tmp[k++] = a[i++];                 // @a ms.rest
        while (j <= r) tmp[k++] = a[j++];
        System.arraycopy(tmp, 0, a, l, tmp.length);       // @a ms.copy
    }
}
