def merge_sort(a, l, r):                            # @a ms.sig
    if l >= r: return                               # @a ms.base
    m = (l + r) // 2                                # @a ms.split
    merge_sort(a, l, m)
    merge_sort(a, m + 1, r)
    tmp, i, j = [], l, m + 1
    while i <= m and j <= r:
        if a[i] <= a[j]:                            # @a ms.cmp
            tmp.append(a[i]); i += 1                # @a ms.takeL
        else:
            tmp.append(a[j]); j += 1                # @a ms.takeR
    tmp += a[i:m + 1]                               # @a ms.restL
    tmp += a[j:r + 1]                               # @a ms.restR
    a[l:r + 1] = tmp                                # @a ms.copy
