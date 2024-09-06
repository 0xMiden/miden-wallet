export const PoseidonFirstHashOutputWGSL = `
fn dt(ez: fw)-> array<fw,9>{var cn = fm;var bp = ei(cn[1],ea);var bf = ei(cn[2],ez);cn[1] = bp;cn[2] = bf;return cn;}
`;

export const PoseidonRoundPartialWGSL = `
fn ce(ci: array<fw,9>,db: u32)-> array<fw,9>{var cz: array<fw,9> = ci;for(var gc = 0u;gc < 9u;gc++){var da = cz[gc];var fg = ei(da,ga[db][gc]);cz[gc] = fg;}var bi = az(cz[0]);cz[0] = bi;var ap: array<fw,9> = cz;for(var gc = 0u;gc < 9u;gc++){var fc = bn(array<u32,8>(0,0,0,0,0,0,0,0));var bd = fq[gc];for(var ah = 0u;ah < 9u;ah++){var ae = el(cz[ah],bd[ah]);fc = ei(fc,ae);}ap[gc] = fc;}return ap;}
`;

export const PoseidonRoundFullWGSL = `
fn ec(ci: array<fw,9>,db: u32)-> array<fw,9>{var cz: array<fw,9> = ci;for(var gc = 0u;gc < 9u;gc++){var da = cz[gc];var fg = ei(da,ga[db][gc]);cz[gc] = fg;}for(var gc = 0u;gc < 9u;gc++){cz[gc] = az(cz[gc]);}var ap: array<fw,9> = cz;for(var gc = 0u;gc < 9u;gc++){var fc = cf;var bd = fq[gc];for(var ah = 0u;ah < 9u;ah++){var ae = el(cz[ah],bd[ah]);fc = ei(fc,ae);}ap[gc] = fc;}return ap;};
`;
