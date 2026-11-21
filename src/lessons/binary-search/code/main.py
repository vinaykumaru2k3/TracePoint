# a must be sorted in ascending order
def binary_search(a, target):              # @a bs.sig
    lo, hi = 0, len(a) - 1                  # @a bs.init
    while lo <= hi:                         # @a bs.loop
        mid = lo + (hi - lo) // 2           # @a bs.mid
        if a[mid] == target: return mid     # @a bs.hit
        if a[mid] < target: lo = mid + 1    # @a bs.right
        else: hi = mid - 1                  # @a bs.left
    return -1                               # @a bs.none
