def linear_search(a, target):              # @a ls.sig
    for i in range(len(a)):                 # @a ls.loop
        if a[i] == target:                  # @a ls.cmp
            return i                        # @a ls.hit
    return -1                               # @a ls.none
