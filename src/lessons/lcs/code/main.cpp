#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int lcs(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));     // @a lc.init
    for (int i = 1; i <= n; i++) {                            // @a lc.row
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;   // @a lc.match
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);             // @a lc.max
        }
    }
    string out;
    int i = n, j = m;
    while (i > 0 && j > 0) {                                  // @a lc.trace
        if (a[i - 1] == b[j - 1]) { out.insert(out.begin(), a[i - 1]); i--; j--; }   // @a lc.tbmatch
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;           // @a lc.tbup
        else j--;                                             // @a lc.tbleft
    }
    cout << out << "\n";
    return dp[n][m];                                          // @a lc.ret
}
