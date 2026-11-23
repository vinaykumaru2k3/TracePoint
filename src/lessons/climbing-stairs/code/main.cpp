#include <vector>
using namespace std;

int climb(int n) {
    vector<int> ways(n + 1);                              // @a stairs.init
    ways[0] = ways[1] = 1;                                // @a stairs.base
    for (int i = 2; i <= n; i++) {                        // @a stairs.loop
        ways[i] = ways[i - 1] + ways[i - 2];              // @a stairs.fill
    }
    return ways[n];                                       // @a stairs.ret
}
