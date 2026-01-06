export class MidenClientInterface {
  static async create() {
    return new this();
  }

  free() {}
}
