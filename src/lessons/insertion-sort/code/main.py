def insertion_sort(a):                              # @a in.sig
    for i in range(1, len(a)):                      # @a in.outer
        key = a[i]                                  # @a in.key
        j = i - 1
        while j >= 0 and a[j] > key:                # @a in.cmp
            a[j + 1] = a[j]                         # @a in.shift
            j -= 1
        a[j + 1] = key                              # @a in.drop
    return a
