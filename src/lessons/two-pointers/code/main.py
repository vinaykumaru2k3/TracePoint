# a must be sorted in ascending order
def pair_with_sum(a, target):                  # @a tp.sig
    lo, hi = 0, len(a) - 1
    while lo < hi:                             # @a tp.loop
        s = a[lo] + a[hi]                      # @a tp.sum
        if s == target: return [lo, hi]        # @a tp.found
        if s < target: lo += 1                 # @a tp.lo
        else: hi -= 1                          # @a tp.hi
    return []                                  # @a tp.none
