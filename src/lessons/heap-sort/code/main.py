def heap_sort(a):                                   # @a sort.sig
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):             # @a build.loop
        sift_down(a, i, n)                          # @a build.loop
    for end in range(n - 1, 0, -1):                 # @a out.loop
        a[0], a[end] = a[end], a[0]                 # @a out.swap
        sift_down(a, 0, end)                        # @a out.sift

# Max-heap sift-down inside a[0:size].
def sift_down(a, i, size):
    while True:
        l, r, m = 2 * i + 1, 2 * i + 2, i           # @a sift.cmp
        if l < size and a[l] > a[m]: m = l          # @a sift.cmp
        if r < size and a[r] > a[m]: m = r          # @a sift.cmp
        if m == i: return                           # @a sift.stop
        a[i], a[m] = a[m], a[i]                     # @a sift.swap
        i = m                                       # @a sift.swap
