terraform {
  backend "s3" {
    bucket         = "tfstate-innovatech-omar"   # zorg dat dit exact zo is
    key            = "envs/dev/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "tf-locks-innovatech"
    encrypt        = true
  }
}
