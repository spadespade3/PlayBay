/* qrcode-generator extracted from AirConsole shared chunk (useViewportMinimumToPixels-BKkeCz0L.js) L376-1566 */
                    st = (function () {
                      var W = function (g, l) {
                        var d = g,
                          e = lt[l],
                          t = null,
                          n = 0,
                          o = null,
                          i = [],
                          s = {},
                          m = function (r, c) {
                            ((t = (function (a) {
                              for (var h = new Array(a), u = 0; u < a; u += 1) {
                                h[u] = new Array(a);
                                for (var S = 0; S < a; S += 1) h[u][S] = null;
                              }
                              return h;
                            })((n = 4 * d + 17))),
                              f(0, 0),
                              f(n - 7, 0),
                              f(0, n - 7),
                              v(),
                              b(),
                              _(r, c),
                              d >= 7 && C(r),
                              o == null && (o = I(d, e, i)),
                              x(o, c));
                          },
                          f = function (r, c) {
                            for (var a = -1; a <= 7; a += 1)
                              if (!(r + a <= -1 || n <= r + a))
                                for (var h = -1; h <= 7; h += 1)
                                  c + h <= -1 ||
                                    n <= c + h ||
                                    (t[r + a][c + h] =
                                      (0 <= a && a <= 6 && (h == 0 || h == 6)) ||
                                      (0 <= h && h <= 6 && (a == 0 || a == 6)) ||
                                      (2 <= a && a <= 4 && 2 <= h && h <= 4));
                          },
                          b = function () {
                            for (var r = 8; r < n - 8; r += 1) t[r][6] == null && (t[r][6] = r % 2 == 0);
                            for (var c = 8; c < n - 8; c += 1) t[6][c] == null && (t[6][c] = c % 2 == 0);
                          },
                          v = function () {
                            for (var r = K.getPatternPosition(d), c = 0; c < r.length; c += 1)
                              for (var a = 0; a < r.length; a += 1) {
                                var h = r[c],
                                  u = r[a];
                                if (t[h][u] == null)
                                  for (var S = -2; S <= 2; S += 1)
                                    for (var z = -2; z <= 2; z += 1)
                                      t[h + S][u + z] = S == -2 || S == 2 || z == -2 || z == 2 || (S == 0 && z == 0);
                              }
                          },
                          C = function (r) {
                            for (var c = K.getBCHTypeNumber(d), a = 0; a < 18; a += 1) {
                              var h = !r && ((c >> a) & 1) == 1;
                              t[Math.floor(a / 3)][(a % 3) + n - 8 - 3] = h;
                            }
                            for (a = 0; a < 18; a += 1) ((h = !r && ((c >> a) & 1) == 1), (t[(a % 3) + n - 8 - 3][Math.floor(a / 3)] = h));
                          },
                          _ = function (r, c) {
                            for (var a = (e << 3) | c, h = K.getBCHTypeInfo(a), u = 0; u < 15; u += 1) {
                              var S = !r && ((h >> u) & 1) == 1;
                              u < 6 ? (t[u][8] = S) : u < 8 ? (t[u + 1][8] = S) : (t[n - 15 + u][8] = S);
                            }
                            for (u = 0; u < 15; u += 1)
                              ((S = !r && ((h >> u) & 1) == 1),
                                u < 8 ? (t[8][n - u - 1] = S) : u < 9 ? (t[8][15 - u - 1 + 1] = S) : (t[8][15 - u - 1] = S));
                            t[n - 8][8] = !r;
                          },
                          x = function (r, c) {
                            for (var a = -1, h = n - 1, u = 7, S = 0, z = K.getMaskFunction(c), D = n - 1; D > 0; D -= 2)
                              for (D == 6 && (D -= 1); ;) {
                                for (var R = 0; R < 2; R += 1)
                                  if (t[h][D - R] == null) {
                                    var N = !1;
                                    (S < r.length && (N = ((r[S] >>> u) & 1) == 1),
                                      z(h, D - R) && (N = !N),
                                      (t[h][D - R] = N),
                                      (u -= 1) == -1 && ((S += 1), (u = 7)));
                                  }
                                if ((h += a) < 0 || n <= h) {
                                  ((h -= a), (a = -a));
                                  break;
                                }
                              }
                          },
                          I = function (r, c, a) {
                            for (var h = _t.getRSBlocks(r, c), u = gt(), S = 0; S < a.length; S += 1) {
                              var z = a[S];
                              (u.put(z.getMode(), 4), u.put(z.getLength(), K.getLengthInBits(z.getMode(), r)), z.write(u));
                            }
                            var D = 0;
                            for (S = 0; S < h.length; S += 1) D += h[S].dataCount;
                            if (u.getLengthInBits() > 8 * D) throw "code length overflow. (" + u.getLengthInBits() + ">" + 8 * D + ")";
                            for (u.getLengthInBits() + 4 <= 8 * D && u.put(0, 4); u.getLengthInBits() % 8 != 0;) u.putBit(!1);
                            for (; !(u.getLengthInBits() >= 8 * D || (u.put(236, 8), u.getLengthInBits() >= 8 * D));) u.put(17, 8);
                            return (function (R, N) {
                              for (var H = 0, J = 0, G = 0, V = new Array(N.length), j = new Array(N.length), M = 0; M < N.length; M += 1) {
                                var F = N[M].dataCount,
                                  X = N[M].totalCount - F;
                                ((J = Math.max(J, F)), (G = Math.max(G, X)), (V[M] = new Array(F)));
                                for (var B = 0; B < V[M].length; B += 1) V[M][B] = 255 & R.getBuffer()[B + H];
                                H += F;
                                var ot = K.getErrorCorrectPolynomial(X),
                                  it = ut(V[M], ot.getLength() - 1).mod(ot);
                                for (j[M] = new Array(ot.getLength() - 1), B = 0; B < j[M].length; B += 1) {
                                  var et = B + it.getLength() - j[M].length;
                                  j[M][B] = et >= 0 ? it.getAt(et) : 0;
                                }
                              }
                              var xt = 0;
                              for (B = 0; B < N.length; B += 1) xt += N[B].totalCount;
                              var ft = new Array(xt),
                                ct = 0;
                              for (B = 0; B < J; B += 1)
                                for (M = 0; M < N.length; M += 1) B < V[M].length && ((ft[ct] = V[M][B]), (ct += 1));
                              for (B = 0; B < G; B += 1)
                                for (M = 0; M < N.length; M += 1) B < j[M].length && ((ft[ct] = j[M][B]), (ct += 1));
                              return ft;
                            })(u, h);
                          };
                        ((s.addData = function (r, c) {
                          var a = null;
                          switch ((c = c || "Byte")) {
                            case "Numeric":
                              a = yt(r);
                              break;
                            case "Alphanumeric":
                              a = bt(r);
                              break;
                            case "Byte":
                              a = pt(r);
                              break;
                            case "Kanji":
                              a = Ct(r);
                              break;
                            default:
                              throw "mode:" + c;
                          }
                          (i.push(a), (o = null));
                        }),
                          (s.isDark = function (r, c) {
                            if (r < 0 || n <= r || c < 0 || n <= c) throw r + "," + c;
                            return t[r][c];
                          }),
                          (s.getModuleCount = function () {
                            return n;
                          }),
                          (s.make = function () {
                            if (d < 1) {
                              for (var r = 1; r < 40; r++) {
                                for (var c = _t.getRSBlocks(r, e), a = gt(), h = 0; h < i.length; h++) {
                                  var u = i[h];
                                  (a.put(u.getMode(), 4), a.put(u.getLength(), K.getLengthInBits(u.getMode(), r)), u.write(a));
                                }
                                var S = 0;
                                for (h = 0; h < c.length; h++) S += c[h].dataCount;
                                if (a.getLengthInBits() <= 8 * S) break;
                              }
                              d = r;
                            }
                            m(
                              !1,
                              (function () {
                                for (var z = 0, D = 0, R = 0; R < 8; R += 1) {
                                  m(!0, R);
                                  var N = K.getLostPoint(s);
                                  (R == 0 || z > N) && ((z = N), (D = R));
                                }
                                return D;
                              })(),
                            );
                          }),
                          (s.createTableTag = function (r, c) {
                            r = r || 2;
                            var a = "";
                            ((a += '<table style="'),
                              (a += " border-width: 0px; border-style: none;"),
                              (a += " border-collapse: collapse;"),
                              (a += " padding: 0px; margin: " + (c = c === void 0 ? 4 * r : c) + "px;"),
                              (a += '">'),
                              (a += "<tbody>"));
                            for (var h = 0; h < s.getModuleCount(); h += 1) {
                              a += "<tr>";
                              for (var u = 0; u < s.getModuleCount(); u += 1)
                                ((a += '<td style="'),
                                  (a += " border-width: 0px; border-style: none;"),
                                  (a += " border-collapse: collapse;"),
                                  (a += " padding: 0px; margin: 0px;"),
                                  (a += " width: " + r + "px;"),
                                  (a += " height: " + r + "px;"),
                                  (a += " background-color: "),
                                  (a += s.isDark(h, u) ? "#000000" : "#ffffff"),
                                  (a += ";"),
                                  (a += '"/>'));
                              a += "</tr>";
                            }
                            return (a += "</tbody>") + "</table>";
                          }),
                          (s.createSvgTag = function (r, c, a, h) {
                            var u = {};
                            (typeof arguments[0] == "object" &&
                              ((r = (u = arguments[0]).cellSize), (c = u.margin), (a = u.alt), (h = u.title)),
                              (r = r || 2),
                              (c = c === void 0 ? 4 * r : c),
                              ((a = typeof a == "string" ? { text: a } : a || {}).text = a.text || null),
                              (a.id = a.text ? a.id || "qrcode-description" : null),
                              ((h = typeof h == "string" ? { text: h } : h || {}).text = h.text || null),
                              (h.id = h.text ? h.id || "qrcode-title" : null));
                            var S,
                              z,
                              D,
                              R,
                              N = s.getModuleCount() * r + 2 * c,
                              H = "";
                            for (
                              R = "l" + r + ",0 0," + r + " -" + r + ",0 0,-" + r + "z ",
                                H += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',
                                H += u.scalable ? "" : ' width="' + N + 'px" height="' + N + 'px"',
                                H += ' viewBox="0 0 ' + N + " " + N + '" ',
                                H += ' preserveAspectRatio="xMinYMin meet"',
                                H += h.text || a.text ? ' role="img" aria-labelledby="' + O([h.id, a.id].join(" ").trim()) + '"' : "",
                                H += ">",
                                H += h.text ? '<title id="' + O(h.id) + '">' + O(h.text) + "</title>" : "",
                                H += a.text ? '<description id="' + O(a.id) + '">' + O(a.text) + "</description>" : "",
                                H += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',
                                H += '<path d="',
                                z = 0;
                              z < s.getModuleCount();
                              z += 1
                            )
                              for (D = z * r + c, S = 0; S < s.getModuleCount(); S += 1)
                                s.isDark(z, S) && (H += "M" + (S * r + c) + "," + D + R);
                            return (H += '" stroke="transparent" fill="black"/>') + "</svg>";
                          }),
                          (s.createDataURL = function (r, c) {
                            ((r = r || 2), (c = c === void 0 ? 4 * r : c));
                            var a = s.getModuleCount() * r + 2 * c,
                              h = c,
                              u = a - c;
                            return wt(a, a, function (S, z) {
                              if (h <= S && S < u && h <= z && z < u) {
                                var D = Math.floor((S - h) / r),
                                  R = Math.floor((z - h) / r);
                                return s.isDark(R, D) ? 0 : 1;
                              }
                              return 1;
                            });
                          }),
                          (s.createImgTag = function (r, c, a) {
                            ((r = r || 2), (c = c === void 0 ? 4 * r : c));
                            var h = s.getModuleCount() * r + 2 * c,
                              u = "";
                            return (
                              (u += "<img"),
                              (u += ' src="'),
                              (u += s.createDataURL(r, c)),
                              (u += '"'),
                              (u += ' width="'),
                              (u += h),
                              (u += '"'),
                              (u += ' height="'),
                              (u += h),
                              (u += '"'),
                              a && ((u += ' alt="'), (u += O(a)), (u += '"')),
                              u + "/>"
                            );
                          }));
                        var O = function (r) {
                          for (var c = "", a = 0; a < r.length; a += 1) {
                            var h = r.charAt(a);
                            switch (h) {
                              case "<":
                                c += "&lt;";
                                break;
                              case ">":
                                c += "&gt;";
                                break;
                              case "&":
                                c += "&amp;";
                                break;
                              case '"':
                                c += "&quot;";
                                break;
                              default:
                                c += h;
                            }
                          }
                          return c;
                        };
                        return (
                          (s.createASCII = function (r, c) {
                            if ((r = r || 1) < 2)
                              return (function (V) {
                                V = V === void 0 ? 2 : V;
                                var j,
                                  M,
                                  F,
                                  X,
                                  B,
                                  ot = 1 * s.getModuleCount() + 2 * V,
                                  it = V,
                                  et = ot - V,
                                  xt = { "â–ˆâ–ˆ": "â–ˆ", "â–ˆ ": "â–€", " â–ˆ": "â–„", "  ": " " },
                                  ft = { "â–ˆâ–ˆ": "â–€", "â–ˆ ": "â–€", " â–ˆ": " ", "  ": " " },
                                  ct = "";
                                for (j = 0; j < ot; j += 2) {
                                  for (F = Math.floor((j - it) / 1), X = Math.floor((j + 1 - it) / 1), M = 0; M < ot; M += 1)
                                    ((B = "â–ˆ"),
                                      it <= M && M < et && it <= j && j < et && s.isDark(F, Math.floor((M - it) / 1)) && (B = " "),
                                      it <= M && M < et && it <= j + 1 && j + 1 < et && s.isDark(X, Math.floor((M - it) / 1))
                                        ? (B += " ")
                                        : (B += "â–ˆ"),
                                      (ct += V < 1 && j + 1 >= et ? ft[B] : xt[B]));
                                  ct += "\n";
                                }
                                return ot % 2 && V > 0
                                  ? ct.substring(0, ct.length - ot - 1) + Array(ot + 1).join("â–€")
                                  : ct.substring(0, ct.length - 1);
                              })(c);
                            ((r -= 1), (c = c === void 0 ? 2 * r : c));
                            var a,
                              h,
                              u,
                              S,
                              z = s.getModuleCount() * r + 2 * c,
                              D = c,
                              R = z - c,
                              N = Array(r + 1).join("â–ˆâ–ˆ"),
                              H = Array(r + 1).join("  "),
                              J = "",
                              G = "";
                            for (a = 0; a < z; a += 1) {
                              for (u = Math.floor((a - D) / r), G = "", h = 0; h < z; h += 1)
                                ((S = 1),
                                  D <= h && h < R && D <= a && a < R && s.isDark(u, Math.floor((h - D) / r)) && (S = 0),
                                  (G += S ? N : H));
                              for (u = 0; u < r; u += 1) J += G + "\n";
                            }
                            return J.substring(0, J.length - 1);
                          }),
                          (s.renderTo2dContext = function (r, c) {
                            c = c || 2;
                            for (var a = s.getModuleCount(), h = 0; h < a; h++)
                              for (var u = 0; u < a; u++)
                                ((r.fillStyle = s.isDark(h, u) ? "black" : "white"), r.fillRect(h * c, u * c, c, c));
                          }),
                          s
                        );
                      };
                      ((W.stringToBytes = (W.stringToBytesFuncs = {
                        default: function (g) {
                          for (var l = [], d = 0; d < g.length; d += 1) {
                            var e = g.charCodeAt(d);
                            l.push(255 & e);
                          }
                          return l;
                        },
                      }).default),
                        (W.createStringToBytes = function (g, l) {
                          var d = (function () {
                              for (
                                var t = Mt(g),
                                  n = function () {
                                    var b = t.read();
                                    if (b == -1) throw "eof";
                                    return b;
                                  },
                                  o = 0,
                                  i = {};
                                ;
                              ) {
                                var s = t.read();
                                if (s == -1) break;
                                var m = n(),
                                  f = (n() << 8) | n();
                                ((i[String.fromCharCode((s << 8) | m)] = f), (o += 1));
                              }
                              if (o != l) throw o + " != " + l;
                              return i;
                            })(),
                            e = 63;
                          return function (t) {
                            for (var n = [], o = 0; o < t.length; o += 1) {
                              var i = t.charCodeAt(o);
                              if (i < 128) n.push(i);
                              else {
                                var s = d[t.charAt(o)];
                                typeof s == "number" ? ((255 & s) == s ? n.push(s) : (n.push(s >>> 8), n.push(255 & s))) : n.push(e);
                              }
                            }
                            return n;
                          };
                        }));
                      var rt,
                        at,
                        nt,
                        E,
                        dt,
                        lt = { L: 1, M: 0, Q: 3, H: 2 },
                        K =
                          ((rt = [
                            [],
                            [6, 18],
                            [6, 22],
                            [6, 26],
                            [6, 30],
                            [6, 34],
                            [6, 22, 38],
                            [6, 24, 42],
                            [6, 26, 46],
                            [6, 28, 50],
                            [6, 30, 54],
                            [6, 32, 58],
                            [6, 34, 62],
                            [6, 26, 46, 66],
                            [6, 26, 48, 70],
                            [6, 26, 50, 74],
                            [6, 30, 54, 78],
                            [6, 30, 56, 82],
                            [6, 30, 58, 86],
                            [6, 34, 62, 90],
                            [6, 28, 50, 72, 94],
                            [6, 26, 50, 74, 98],
                            [6, 30, 54, 78, 102],
                            [6, 28, 54, 80, 106],
                            [6, 32, 58, 84, 110],
                            [6, 30, 58, 86, 114],
                            [6, 34, 62, 90, 118],
                            [6, 26, 50, 74, 98, 122],
                            [6, 30, 54, 78, 102, 126],
                            [6, 26, 52, 78, 104, 130],
                            [6, 30, 56, 82, 108, 134],
                            [6, 34, 60, 86, 112, 138],
                            [6, 30, 58, 86, 114, 142],
                            [6, 34, 62, 90, 118, 146],
                            [6, 30, 54, 78, 102, 126, 150],
                            [6, 24, 50, 76, 102, 128, 154],
                            [6, 28, 54, 80, 106, 132, 158],
                            [6, 32, 58, 84, 110, 136, 162],
                            [6, 26, 54, 82, 110, 138, 166],
                            [6, 30, 58, 86, 114, 142, 170],
                          ]),
                          (at = 1335),
                          (nt = 7973),
                          (dt = function (g) {
                            for (var l = 0; g != 0;) ((l += 1), (g >>>= 1));
                            return l;
                          }),
                          ((E = {}).getBCHTypeInfo = function (g) {
                            for (var l = g << 10; dt(l) - dt(at) >= 0;) l ^= at << (dt(l) - dt(at));
                            return 21522 ^ ((g << 10) | l);
                          }),
                          (E.getBCHTypeNumber = function (g) {
                            for (var l = g << 12; dt(l) - dt(nt) >= 0;) l ^= nt << (dt(l) - dt(nt));
                            return (g << 12) | l;
                          }),
                          (E.getPatternPosition = function (g) {
                            return rt[g - 1];
                          }),
                          (E.getMaskFunction = function (g) {
                            switch (g) {
                              case 0:
                                return function (l, d) {
                                  return (l + d) % 2 == 0;
                                };
                              case 1:
                                return function (l, d) {
                                  return l % 2 == 0;
                                };
                              case 2:
                                return function (l, d) {
                                  return d % 3 == 0;
                                };
                              case 3:
                                return function (l, d) {
                                  return (l + d) % 3 == 0;
                                };
                              case 4:
                                return function (l, d) {
                                  return (Math.floor(l / 2) + Math.floor(d / 3)) % 2 == 0;
                                };
                              case 5:
                                return function (l, d) {
                                  return ((l * d) % 2) + ((l * d) % 3) == 0;
                                };
                              case 6:
                                return function (l, d) {
                                  return (((l * d) % 2) + ((l * d) % 3)) % 2 == 0;
                                };
                              case 7:
                                return function (l, d) {
                                  return (((l * d) % 3) + ((l + d) % 2)) % 2 == 0;
                                };
                              default:
                                throw "bad maskPattern:" + g;
                            }
                          }),
                          (E.getErrorCorrectPolynomial = function (g) {
                            for (var l = ut([1], 0), d = 0; d < g; d += 1) l = l.multiply(ut([1, tt.gexp(d)], 0));
                            return l;
                          }),
                          (E.getLengthInBits = function (g, l) {
                            if (1 <= l && l < 10)
                              switch (g) {
                                case 1:
                                  return 10;
                                case 2:
                                  return 9;
                                case 4:
                                case 8:
                                  return 8;
                                default:
                                  throw "mode:" + g;
                              }
                            else if (l < 27)
                              switch (g) {
                                case 1:
                                  return 12;
                                case 2:
                                  return 11;
                                case 4:
                                  return 16;
                                case 8:
                                  return 10;
                                default:
                                  throw "mode:" + g;
                              }
                            else {
                              if (!(l < 41)) throw "type:" + l;
                              switch (g) {
                                case 1:
                                  return 14;
                                case 2:
                                  return 13;
                                case 4:
                                  return 16;
                                case 8:
                                  return 12;
                                default:
                                  throw "mode:" + g;
                              }
                            }
                          }),
                          (E.getLostPoint = function (g) {
                            for (var l = g.getModuleCount(), d = 0, e = 0; e < l; e += 1)
                              for (var t = 0; t < l; t += 1) {
                                for (var n = 0, o = g.isDark(e, t), i = -1; i <= 1; i += 1)
                                  if (!(e + i < 0 || l <= e + i))
                                    for (var s = -1; s <= 1; s += 1)
                                      t + s < 0 || l <= t + s || (i == 0 && s == 0) || (o == g.isDark(e + i, t + s) && (n += 1));
                                n > 5 && (d += 3 + n - 5);
                              }
                            for (e = 0; e < l - 1; e += 1)
                              for (t = 0; t < l - 1; t += 1) {
                                var m = 0;
                                (g.isDark(e, t) && (m += 1),
                                  g.isDark(e + 1, t) && (m += 1),
                                  g.isDark(e, t + 1) && (m += 1),
                                  g.isDark(e + 1, t + 1) && (m += 1),
                                  (m != 0 && m != 4) || (d += 3));
                              }
                            for (e = 0; e < l; e += 1)
                              for (t = 0; t < l - 6; t += 1)
                                g.isDark(e, t) &&
                                  !g.isDark(e, t + 1) &&
                                  g.isDark(e, t + 2) &&
                                  g.isDark(e, t + 3) &&
                                  g.isDark(e, t + 4) &&
                                  !g.isDark(e, t + 5) &&
                                  g.isDark(e, t + 6) &&
                                  (d += 40);
                            for (t = 0; t < l; t += 1)
                              for (e = 0; e < l - 6; e += 1)
                                g.isDark(e, t) &&
                                  !g.isDark(e + 1, t) &&
                                  g.isDark(e + 2, t) &&
                                  g.isDark(e + 3, t) &&
                                  g.isDark(e + 4, t) &&
                                  !g.isDark(e + 5, t) &&
                                  g.isDark(e + 6, t) &&
                                  (d += 40);
                            var f = 0;
                            for (t = 0; t < l; t += 1) for (e = 0; e < l; e += 1) g.isDark(e, t) && (f += 1);
                            return d + (Math.abs((100 * f) / l / l - 50) / 5) * 10;
                          }),
                          E),
                        tt = (function () {
                          for (var g = new Array(256), l = new Array(256), d = 0; d < 8; d += 1) g[d] = 1 << d;
                          for (d = 8; d < 256; d += 1) g[d] = g[d - 4] ^ g[d - 5] ^ g[d - 6] ^ g[d - 8];
                          for (d = 0; d < 255; d += 1) l[g[d]] = d;
                          return {
                            glog: function (e) {
                              if (e < 1) throw "glog(" + e + ")";
                              return l[e];
                            },
                            gexp: function (e) {
                              for (; e < 0;) e += 255;
                              for (; e >= 256;) e -= 255;
                              return g[e];
                            },
                          };
                        })();
                      function ut(g, l) {
                        if (g.length === void 0) throw g.length + "/" + l;
                        var d = (function () {
                            for (var t = 0; t < g.length && g[t] == 0;) t += 1;
                            for (var n = new Array(g.length - t + l), o = 0; o < g.length - t; o += 1) n[o] = g[o + t];
                            return n;
                          })(),
                          e = {
                            getAt: function (t) {
                              return d[t];
                            },
                            getLength: function () {
                              return d.length;
                            },
                            multiply: function (t) {
                              for (var n = new Array(e.getLength() + t.getLength() - 1), o = 0; o < e.getLength(); o += 1)
                                for (var i = 0; i < t.getLength(); i += 1) n[o + i] ^= tt.gexp(tt.glog(e.getAt(o)) + tt.glog(t.getAt(i)));
                              return ut(n, 0);
                            },
                            mod: function (t) {
                              if (e.getLength() - t.getLength() < 0) return e;
                              for (
                                var n = tt.glog(e.getAt(0)) - tt.glog(t.getAt(0)), o = new Array(e.getLength()), i = 0;
                                i < e.getLength();
                                i += 1
                              )
                                o[i] = e.getAt(i);
                              for (i = 0; i < t.getLength(); i += 1) o[i] ^= tt.gexp(tt.glog(t.getAt(i)) + n);
                              return ut(o, 0).mod(t);
                            },
                          };
                        return e;
                      }
                      var _t = (function () {
                          var g = [
                              [1, 26, 19],
                              [1, 26, 16],
                              [1, 26, 13],
                              [1, 26, 9],
                              [1, 44, 34],
                              [1, 44, 28],
                              [1, 44, 22],
                              [1, 44, 16],
                              [1, 70, 55],
                              [1, 70, 44],
                              [2, 35, 17],
                              [2, 35, 13],
                              [1, 100, 80],
                              [2, 50, 32],
                              [2, 50, 24],
                              [4, 25, 9],
                              [1, 134, 108],
                              [2, 67, 43],
                              [2, 33, 15, 2, 34, 16],
                              [2, 33, 11, 2, 34, 12],
                              [2, 86, 68],
                              [4, 43, 27],
                              [4, 43, 19],
                              [4, 43, 15],
                              [2, 98, 78],
                              [4, 49, 31],
                              [2, 32, 14, 4, 33, 15],
                              [4, 39, 13, 1, 40, 14],
                              [2, 121, 97],
                              [2, 60, 38, 2, 61, 39],
                              [4, 40, 18, 2, 41, 19],
                              [4, 40, 14, 2, 41, 15],
                              [2, 146, 116],
                              [3, 58, 36, 2, 59, 37],
                              [4, 36, 16, 4, 37, 17],
                              [4, 36, 12, 4, 37, 13],
                              [2, 86, 68, 2, 87, 69],
                              [4, 69, 43, 1, 70, 44],
                              [6, 43, 19, 2, 44, 20],
                              [6, 43, 15, 2, 44, 16],
                              [4, 101, 81],
                              [1, 80, 50, 4, 81, 51],
                              [4, 50, 22, 4, 51, 23],
                              [3, 36, 12, 8, 37, 13],
                              [2, 116, 92, 2, 117, 93],
                              [6, 58, 36, 2, 59, 37],
                              [4, 46, 20, 6, 47, 21],
                              [7, 42, 14, 4, 43, 15],
                              [4, 133, 107],
                              [8, 59, 37, 1, 60, 38],
                              [8, 44, 20, 4, 45, 21],
                              [12, 33, 11, 4, 34, 12],
                              [3, 145, 115, 1, 146, 116],
                              [4, 64, 40, 5, 65, 41],
                              [11, 36, 16, 5, 37, 17],
                              [11, 36, 12, 5, 37, 13],
                              [5, 109, 87, 1, 110, 88],
                              [5, 65, 41, 5, 66, 42],
                              [5, 54, 24, 7, 55, 25],
                              [11, 36, 12, 7, 37, 13],
                              [5, 122, 98, 1, 123, 99],
                              [7, 73, 45, 3, 74, 46],
                              [15, 43, 19, 2, 44, 20],
                              [3, 45, 15, 13, 46, 16],
                              [1, 135, 107, 5, 136, 108],
                              [10, 74, 46, 1, 75, 47],
                              [1, 50, 22, 15, 51, 23],
                              [2, 42, 14, 17, 43, 15],
                              [5, 150, 120, 1, 151, 121],
                              [9, 69, 43, 4, 70, 44],
                              [17, 50, 22, 1, 51, 23],
                              [2, 42, 14, 19, 43, 15],
                              [3, 141, 113, 4, 142, 114],
                              [3, 70, 44, 11, 71, 45],
                              [17, 47, 21, 4, 48, 22],
                              [9, 39, 13, 16, 40, 14],
                              [3, 135, 107, 5, 136, 108],
                              [3, 67, 41, 13, 68, 42],
                              [15, 54, 24, 5, 55, 25],
                              [15, 43, 15, 10, 44, 16],
                              [4, 144, 116, 4, 145, 117],
                              [17, 68, 42],
                              [17, 50, 22, 6, 51, 23],
                              [19, 46, 16, 6, 47, 17],
                              [2, 139, 111, 7, 140, 112],
                              [17, 74, 46],
                              [7, 54, 24, 16, 55, 25],
                              [34, 37, 13],
                              [4, 151, 121, 5, 152, 122],
                              [4, 75, 47, 14, 76, 48],
                              [11, 54, 24, 14, 55, 25],
                              [16, 45, 15, 14, 46, 16],
                              [6, 147, 117, 4, 148, 118],
                              [6, 73, 45, 14, 74, 46],
                              [11, 54, 24, 16, 55, 25],
                              [30, 46, 16, 2, 47, 17],
                              [8, 132, 106, 4, 133, 107],
                              [8, 75, 47, 13, 76, 48],
                              [7, 54, 24, 22, 55, 25],
                              [22, 45, 15, 13, 46, 16],
                              [10, 142, 114, 2, 143, 115],
                              [19, 74, 46, 4, 75, 47],
                              [28, 50, 22, 6, 51, 23],
                              [33, 46, 16, 4, 47, 17],
                              [8, 152, 122, 4, 153, 123],
                              [22, 73, 45, 3, 74, 46],
                              [8, 53, 23, 26, 54, 24],
                              [12, 45, 15, 28, 46, 16],
                              [3, 147, 117, 10, 148, 118],
                              [3, 73, 45, 23, 74, 46],
                              [4, 54, 24, 31, 55, 25],
                              [11, 45, 15, 31, 46, 16],
                              [7, 146, 116, 7, 147, 117],
                              [21, 73, 45, 7, 74, 46],
                              [1, 53, 23, 37, 54, 24],
                              [19, 45, 15, 26, 46, 16],
                              [5, 145, 115, 10, 146, 116],
                              [19, 75, 47, 10, 76, 48],
                              [15, 54, 24, 25, 55, 25],
                              [23, 45, 15, 25, 46, 16],
                              [13, 145, 115, 3, 146, 116],
                              [2, 74, 46, 29, 75, 47],
                              [42, 54, 24, 1, 55, 25],
                              [23, 45, 15, 28, 46, 16],
                              [17, 145, 115],
                              [10, 74, 46, 23, 75, 47],
                              [10, 54, 24, 35, 55, 25],
                              [19, 45, 15, 35, 46, 16],
                              [17, 145, 115, 1, 146, 116],
                              [14, 74, 46, 21, 75, 47],
                              [29, 54, 24, 19, 55, 25],
                              [11, 45, 15, 46, 46, 16],
                              [13, 145, 115, 6, 146, 116],
                              [14, 74, 46, 23, 75, 47],
                              [44, 54, 24, 7, 55, 25],
                              [59, 46, 16, 1, 47, 17],
                              [12, 151, 121, 7, 152, 122],
                              [12, 75, 47, 26, 76, 48],
                              [39, 54, 24, 14, 55, 25],
                              [22, 45, 15, 41, 46, 16],
                              [6, 151, 121, 14, 152, 122],
                              [6, 75, 47, 34, 76, 48],
                              [46, 54, 24, 10, 55, 25],
                              [2, 45, 15, 64, 46, 16],
                              [17, 152, 122, 4, 153, 123],
                              [29, 74, 46, 14, 75, 47],
                              [49, 54, 24, 10, 55, 25],
                              [24, 45, 15, 46, 46, 16],
                              [4, 152, 122, 18, 153, 123],
                              [13, 74, 46, 32, 75, 47],
                              [48, 54, 24, 14, 55, 25],
                              [42, 45, 15, 32, 46, 16],
                              [20, 147, 117, 4, 148, 118],
                              [40, 75, 47, 7, 76, 48],
                              [43, 54, 24, 22, 55, 25],
                              [10, 45, 15, 67, 46, 16],
                              [19, 148, 118, 6, 149, 119],
                              [18, 75, 47, 31, 76, 48],
                              [34, 54, 24, 34, 55, 25],
                              [20, 45, 15, 61, 46, 16],
                            ],
                            l = function (e, t) {
                              var n = {};
                              return ((n.totalCount = e), (n.dataCount = t), n);
                            },
                            d = {
                              getRSBlocks: function (e, t) {
                                var n = (function (C, _) {
                                  switch (_) {
                                    case lt.L:
                                      return g[4 * (C - 1) + 0];
                                    case lt.M:
                                      return g[4 * (C - 1) + 1];
                                    case lt.Q:
                                      return g[4 * (C - 1) + 2];
                                    case lt.H:
                                      return g[4 * (C - 1) + 3];
                                    default:
                                      return;
                                  }
                                })(e, t);
                                if (n === void 0) throw "bad rs block @ typeNumber:" + e + "/errorCorrectionLevel:" + t;
                                for (var o = n.length / 3, i = [], s = 0; s < o; s += 1)
                                  for (var m = n[3 * s + 0], f = n[3 * s + 1], b = n[3 * s + 2], v = 0; v < m; v += 1) i.push(l(f, b));
                                return i;
                              },
                            };
                          return d;
                        })(),
                        gt = function () {
                          var g = [],
                            l = 0,
                            d = {
                              getBuffer: function () {
                                return g;
                              },
                              getAt: function (e) {
                                var t = Math.floor(e / 8);
                                return ((g[t] >>> (7 - (e % 8))) & 1) == 1;
                              },
                              put: function (e, t) {
                                for (var n = 0; n < t; n += 1) d.putBit(((e >>> (t - n - 1)) & 1) == 1);
                              },
                              getLengthInBits: function () {
                                return l;
                              },
                              putBit: function (e) {
                                var t = Math.floor(l / 8);
                                (g.length <= t && g.push(0), e && (g[t] |= 128 >>> (l % 8)), (l += 1));
                              },
                            };
                          return d;
                        },
                        yt = function (g) {
                          var l = g,
                            d = {
                              getMode: function () {
                                return 1;
                              },
                              getLength: function (n) {
                                return l.length;
                              },
                              write: function (n) {
                                for (var o = l, i = 0; i + 2 < o.length;) (n.put(e(o.substring(i, i + 3)), 10), (i += 3));
                                i < o.length &&
                                  (o.length - i == 1
                                    ? n.put(e(o.substring(i, i + 1)), 4)
                                    : o.length - i == 2 && n.put(e(o.substring(i, i + 2)), 7));
                              },
                            },
                            e = function (n) {
                              for (var o = 0, i = 0; i < n.length; i += 1) o = 10 * o + t(n.charAt(i));
                              return o;
                            },
                            t = function (n) {
                              if ("0" <= n && n <= "9") return n.charCodeAt(0) - 48;
                              throw "illegal char :" + n;
                            };
                          return d;
                        },
                        bt = function (g) {
                          var l = g,
                            d = {
                              getMode: function () {
                                return 2;
                              },
                              getLength: function (t) {
                                return l.length;
                              },
                              write: function (t) {
                                for (var n = l, o = 0; o + 1 < n.length;) (t.put(45 * e(n.charAt(o)) + e(n.charAt(o + 1)), 11), (o += 2));
                                o < n.length && t.put(e(n.charAt(o)), 6);
                              },
                            },
                            e = function (t) {
                              if ("0" <= t && t <= "9") return t.charCodeAt(0) - 48;
                              if ("A" <= t && t <= "Z") return t.charCodeAt(0) - 65 + 10;
                              switch (t) {
                                case " ":
                                  return 36;
                                case "$":
                                  return 37;
                                case "%":
                                  return 38;
                                case "*":
                                  return 39;
                                case "+":
                                  return 40;
                                case "-":
                                  return 41;
                                case ".":
                                  return 42;
                                case "/":
                                  return 43;
                                case ":":
                                  return 44;
                                default:
                                  throw "illegal char :" + t;
                              }
                            };
                          return d;
                        },
                        pt = function (g) {
                          var l = W.stringToBytes(g);
                          return {
                            getMode: function () {
                              return 4;
                            },
                            getLength: function (d) {
                              return l.length;
                            },
                            write: function (d) {
                              for (var e = 0; e < l.length; e += 1) d.put(l[e], 8);
                            },
                          };
                        },
                        Ct = function (g) {
                          var l = W.stringToBytesFuncs.SJIS;
                          if (!l) throw "sjis not supported.";
                          (function () {
                            var t = l("å‹");
                            if (t.length != 2 || ((t[0] << 8) | t[1]) != 38726) throw "sjis not supported.";
                          })();
                          var d = l(g),
                            e = {
                              getMode: function () {
                                return 8;
                              },
                              getLength: function (t) {
                                return ~~(d.length / 2);
                              },
                              write: function (t) {
                                for (var n = d, o = 0; o + 1 < n.length;) {
                                  var i = ((255 & n[o]) << 8) | (255 & n[o + 1]);
                                  if (33088 <= i && i <= 40956) i -= 33088;
                                  else {
                                    if (!(57408 <= i && i <= 60351)) throw "illegal char at " + (o + 1) + "/" + i;
                                    i -= 49472;
                                  }
                                  ((i = 192 * ((i >>> 8) & 255) + (255 & i)), t.put(i, 13), (o += 2));
                                }
                                if (o < n.length) throw "illegal char at " + (o + 1);
                              },
                            };
                          return e;
                        },
                        St = function () {
                          var g = [],
                            l = {
                              writeByte: function (d) {
                                g.push(255 & d);
                              },
                              writeShort: function (d) {
                                (l.writeByte(d), l.writeByte(d >>> 8));
                              },
                              writeBytes: function (d, e, t) {
                                ((e = e || 0), (t = t || d.length));
                                for (var n = 0; n < t; n += 1) l.writeByte(d[n + e]);
                              },
                              writeString: function (d) {
                                for (var e = 0; e < d.length; e += 1) l.writeByte(d.charCodeAt(e));
                              },
                              toByteArray: function () {
                                return g;
                              },
                              toString: function () {
                                var d = "";
                                d += "[";
                                for (var e = 0; e < g.length; e += 1) (e > 0 && (d += ","), (d += g[e]));
                                return d + "]";
                              },
                            };
                          return l;
                        },
                        Mt = function (g) {
                          var l = g,
                            d = 0,
                            e = 0,
                            t = 0,
                            n = {
                              read: function () {
                                for (; t < 8;) {
                                  if (d >= l.length) {
                                    if (t == 0) return -1;
                                    throw "unexpected end of file./" + t;
                                  }
                                  var i = l.charAt(d);
                                  if (((d += 1), i == "=")) return ((t = 0), -1);
                                  i.match(/^\s$/) || ((e = (e << 6) | o(i.charCodeAt(0))), (t += 6));
                                }
                                var s = (e >>> (t - 8)) & 255;
                                return ((t -= 8), s);
                              },
                            },
                            o = function (i) {
                              if (65 <= i && i <= 90) return i - 65;
                              if (97 <= i && i <= 122) return i - 97 + 26;
                              if (48 <= i && i <= 57) return i - 48 + 52;
                              if (i == 43) return 62;
                              if (i == 47) return 63;
                              throw "c:" + i;
                            };
                          return n;
                        },
                        wt = function (g, l, d) {
                          for (
                            var e = (function (f, b) {
                                var v = f,
                                  C = b,
                                  _ = new Array(f * b),
                                  x = {
                                    setPixel: function (r, c, a) {
                                      _[c * v + r] = a;
                                    },
                                    write: function (r) {
                                      (r.writeString("GIF87a"),
                                        r.writeShort(v),
                                        r.writeShort(C),
                                        r.writeByte(128),
                                        r.writeByte(0),
                                        r.writeByte(0),
                                        r.writeByte(0),
                                        r.writeByte(0),
                                        r.writeByte(0),
                                        r.writeByte(255),
                                        r.writeByte(255),
                                        r.writeByte(255),
                                        r.writeString(","),
                                        r.writeShort(0),
                                        r.writeShort(0),
                                        r.writeShort(v),
                                        r.writeShort(C),
                                        r.writeByte(0));
                                      var c = I(2);
                                      r.writeByte(2);
                                      for (var a = 0; c.length - a > 255;) (r.writeByte(255), r.writeBytes(c, a, 255), (a += 255));
                                      (r.writeByte(c.length - a), r.writeBytes(c, a, c.length - a), r.writeByte(0), r.writeString(";"));
                                    },
                                  },
                                  I = function (r) {
                                    for (var c = 1 << r, a = 1 + (1 << r), h = r + 1, u = O(), S = 0; S < c; S += 1)
                                      u.add(String.fromCharCode(S));
                                    (u.add(String.fromCharCode(c)), u.add(String.fromCharCode(a)));
                                    var z,
                                      D,
                                      R,
                                      N = St(),
                                      H =
                                        ((z = N),
                                        (D = 0),
                                        (R = 0),
                                        {
                                          write: function (j, M) {
                                            if (j >>> M) throw "length over";
                                            for (; D + M >= 8;)
                                              (z.writeByte(255 & ((j << D) | R)), (M -= 8 - D), (j >>>= 8 - D), (R = 0), (D = 0));
                                            ((R |= j << D), (D += M));
                                          },
                                          flush: function () {
                                            D > 0 && z.writeByte(R);
                                          },
                                        });
                                    H.write(c, h);
                                    var J = 0,
                                      G = String.fromCharCode(_[J]);
                                    for (J += 1; J < _.length;) {
                                      var V = String.fromCharCode(_[J]);
                                      ((J += 1),
                                        u.contains(G + V)
                                          ? (G += V)
                                          : (H.write(u.indexOf(G), h),
                                            u.size() < 4095 && (u.size() == 1 << h && (h += 1), u.add(G + V)),
                                            (G = V)));
                                    }
                                    return (H.write(u.indexOf(G), h), H.write(a, h), H.flush(), N.toByteArray());
                                  },
                                  O = function () {
                                    var r = {},
                                      c = 0,
                                      a = {
                                        add: function (h) {
                                          if (a.contains(h)) throw "dup key:" + h;
                                          ((r[h] = c), (c += 1));
                                        },
                                        size: function () {
                                          return c;
                                        },
                                        indexOf: function (h) {
                                          return r[h];
                                        },
                                        contains: function (h) {
                                          return r[h] !== void 0;
                                        },
                                      };
                                    return a;
                                  };
                                return x;
                              })(g, l),
                              t = 0;
                            t < l;
                            t += 1
                          )
                            for (var n = 0; n < g; n += 1) e.setPixel(n, t, d(n, t));
                          var o = St();
                          e.write(o);
                          for (
                            var i = (function () {
                                var f = 0,
                                  b = 0,
                                  v = 0,
                                  C = "",
                                  _ = {},
                                  x = function (O) {
                                    C += String.fromCharCode(I(63 & O));
                                  },
                                  I = function (O) {
                                    if (!(O < 0)) {
                                      if (O < 26) return 65 + O;
                                      if (O < 52) return O - 26 + 97;
                                      if (O < 62) return O - 52 + 48;
                                      if (O == 62) return 43;
                                      if (O == 63) return 47;
                                    }
                                    throw "n:" + O;
                                  };
                                return (
                                  (_.writeByte = function (O) {
                                    for (f = (f << 8) | (255 & O), b += 8, v += 1; b >= 6;) (x(f >>> (b - 6)), (b -= 6));
                                  }),
                                  (_.flush = function () {
                                    if ((b > 0 && (x(f << (6 - b)), (f = 0), (b = 0)), v % 3 != 0))
                                      for (var O = 3 - (v % 3), r = 0; r < O; r += 1) C += "=";
                                  }),
                                  (_.toString = function () {
                                    return C;
                                  }),
                                  _
                                );
                              })(),
                              s = o.toByteArray(),
                              m = 0;
                            m < s.length;
                            m += 1
                          )
                            i.writeByte(s[m]);
                          return (i.flush(), "data:image/gif;base64," + i);
                        };
                      return W;
                    })();
                  ((st.stringToBytesFuncs["UTF-8"] = function (W) {
                    return (function (rt) {
                      for (var at = [], nt = 0; nt < rt.length; nt++) {
                        var E = rt.charCodeAt(nt);
                        E < 128
                          ? at.push(E)
                          : E < 2048
                            ? at.push(192 | (E >> 6), 128 | (63 & E))
                            : E < 55296 || E >= 57344
                              ? at.push(224 | (E >> 12), 128 | ((E >> 6) & 63), 128 | (63 & E))
                              : (nt++,
                                (E = 65536 + (((1023 & E) << 10) | (1023 & rt.charCodeAt(nt)))),
                                at.push(240 | (E >> 18), 128 | ((E >> 12) & 63), 128 | ((E >> 6) & 63), 128 | (63 & E)));
                      }
                      return at;
                    })(W);
                  }),
                    (Y =
                      typeof (U = function () {
                        return st;
                      }) == "function"
                        ? U.apply(k, [])
                        : U) === void 0 || (q.exports = Y));
