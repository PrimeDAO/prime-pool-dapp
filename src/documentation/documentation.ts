export class Documentation {

  canActivate(): boolean {
    window.open("https://docs.primedao.io/primedao/products/poolmanager", "_blank", "noopener noreferrer");
    return false;
  }
}
