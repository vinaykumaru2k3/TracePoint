def total_of(a):                       # @a sum.sig
    total = 0
    for i in range(len(a)):            # @a sum.loop
        total += a[i]                  # @a sum.add
    return total                       # @a sum.return


def has_duplicate(a):                  # @a dup.sig
    for i in range(len(a)):            # @a dup.outer
        for j in range(i + 1, len(a)): # @a dup.inner
            if a[i] == a[j]:           # @a dup.cmp
                return True            # @a dup.found
    return False                       # @a dup.none
