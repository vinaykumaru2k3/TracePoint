def quick_sort(a, lo, hi):                          # @a qs.sig
    if lo >= hi: return                             # @a qs.base
    pivot, i = a[hi], lo - 1                        # @a qs.pivot
    for j in range(lo, hi):
        if a[j] < pivot:                            # @a qs.cmp
            i += 1
            a[i], a[j] = a[j], a[i]                 # @a qs.swap
    a[i + 1], a[hi] = a[hi], a[i + 1]               # @a qs.place
    quick_sort(a, lo, i)
    quick_sort(a, i + 2, hi)
