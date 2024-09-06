export const FieldInverseWGSL = `
fn bj(fj: fw)-> fw{var er: fw = fj;var cp: bn = bt;var fd: fw = cd;var bm: fw = cf;while(!cg(er,cd)&& !cg(cp,cd)){while(fx(er)){er = ex(er);if(fx(fd)){fd = ex(fd);}else{fd = ev(fd,bt);fd = ex(fd);}}while(fx(cp)){cp = ex(cp);if(fx(bm)){bm = ex(bm);}else{bm = ev(bm,bt);bm = ex(bm);}}if(dl(er,cp)){er = ew(er,cp);fd = bv(fd,bm);}else{cp = ew(cp,er);bm = bv(bm,fd);}}if(cg(er,cd)){return dg(fd);}else{return dg(bm);}}
`;
