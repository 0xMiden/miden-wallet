export const FieldSubWGSL = `
fn bv(ai: fw,fd: fw)-> fw{var fi: fw;if(dl(ai,fd)){fi = ew(ai,fd);}else{var de: fw = ew(fd,ai);fi = ew(bt,de);}return fi;}
`;
