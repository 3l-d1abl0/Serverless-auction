# Build TypeScript handlers before deploying
resource "null_resource" "typescript_typecheck" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = ".."
    command     = "npm run typecheck"
  }
}

resource "null_resource" "build_typescript" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = ".."
    command     = "npm run build"
  }

  depends_on = [null_resource.typescript_typecheck]
}

resource "null_resource" "package_lambda" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    working_dir = ".."
    command     = "npm run package"
  }

  depends_on = [null_resource.build_typescript]
}
