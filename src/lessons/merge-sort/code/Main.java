class Sort {
    static void mergeSort(int[] a, int l, int r) {        // @a ms.sig
        if (l >= r) return;                               // @a ms.base
        int m = (l + r) / 2;                              // @a ms.split
        mergeSort(a, l, m);
        mergeSort(a, m + 1, r);
        int[] tmp = new int[r - l + 1];
        int i = l, j = m + 1, k = 0;
        while (i <= m && j <= r) {
            if (a[i] <= a[j])                             // @a ms.cmp
                tmp[k++] = a[i++];                        // @a ms.takeL
            else
                tmp[k++] = a[j++];                        // @a ms.takeR
        }
        while (i <= m) tmp[k++] = a[i++];                 // @a ms.restL
        while (j <= r) tmp[k++] = a[j++];                 // @a ms.restR
        System.arraycopy(tmp, 0, a, l, tmp.length);       // @a ms.copy
    }
}
