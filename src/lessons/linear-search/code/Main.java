class Search {
    static int linearSearch(int[] a, int target) {  // @a ls.sig
        for (int i = 0; i < a.length; i++) {        // @a ls.loop
            if (a[i] == target)                     // @a ls.cmp
                return i;                           // @a ls.hit
        }
        return -1;                                  // @a ls.none
    }
}
