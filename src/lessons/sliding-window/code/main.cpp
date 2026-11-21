#include <algorithm>
#include <vector>

int maxSum(const std::vector<int>& a, int k) {      // @a sw.sig
    int sum = 0;
    for (int i = 0; i < k; i++) sum += a[i];        // @a sw.first
    int best = sum;
    for (int i = k; i < (int)a.size(); i++) {
        sum += a[i] - a[i - k];                     // @a sw.slide
        best = std::max(best, sum);                 // @a sw.best
    }
    return best;                                    // @a sw.return
}
