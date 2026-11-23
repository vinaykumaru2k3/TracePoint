#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int editDistance(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));     // @a ed.init
    for (int i = 0; i <= n; i++) dp[i][0] = i;                // @a ed.edgecol
    for (int j = 0; j <= m; j++) dp[0][j] = j;                // @a ed.edgerow
    for (int i = 1; i <= n; i++) {                            // @a ed.row
        for (int j = 1; j <= m; j++) {                        // @a ed.col
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1];   // @a ed.match
            else dp[i][j] = 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});   // @a ed.min
        }
    }
    vector<string> edits;
    int i = n, j = m;                                         // @a ed.tbstart
    while (i > 0 || j > 0) {                                  // @a ed.trace
        if (i > 0 && j > 0 && a[i - 1] == b[j - 1]) { edits.insert(edits.begin(), "keep " + string(1, a[i - 1])); i--; j--; }   // @a ed.tbmatch
        else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) { edits.insert(edits.begin(), "replace " + string(1, b[j - 1])); i--; j--; }   // @a ed.tbrep
        else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) { edits.insert(edits.begin(), "delete " + string(1, a[i - 1])); i--; }   // @a ed.tbdel
        else { edits.insert(edits.begin(), "insert " + string(1, b[j - 1])); j--; }   // @a ed.tbins
    }
    for (const string& e : edits) cout << e << "\n";          // @a ed.print
    return dp[n][m];                                          // @a ed.ret
}
