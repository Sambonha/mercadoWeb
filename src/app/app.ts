import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Produto {
  id?: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.html'
})
export class App {
  private http = inject(HttpClient);
  produtos = signal<Produto[]>([]);
  baseUrl = 'http://localhost:8083/api/v1/produtos';

  produtoParaExcluir: Produto | null = null;

  cadastro = new FormGroup({
    id: new FormControl(''),
    nome: new FormControl(''),
    preco: new FormControl(0),
    quantidade: new FormControl(0),
    categoria: new FormControl('')
  });

  ngOnInit() {
    this.consultarProdutos();
  }

  // ================= TOASTS =================
  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${
      type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'
    } border-0 show`;
    toast.style.minWidth = '280px';
    toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
    toast.style.animation = 'fadeIn 0.4s ease, fadeOut 0.4s ease 3.5s';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ================= CRUD =================

  criarProduto() {
    const produto = this.cadastro.value;

    if (!produto.nome || !produto.categoria) {
      this.showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    produto.nome = produto.nome.toUpperCase();
    produto.categoria = produto.categoria.toUpperCase();

    if (produto.preco! < 0) {
      this.showToast('O preço não pode ser negativo.', 'error');
      return;
    }

    this.http.post(`${this.baseUrl}/criar`, produto).subscribe({
      next: (data: any) => {
        this.showToast(`Produto ${data.nome} cadastrado com sucesso!`, 'success');
        this.cadastro.reset();
        this.consultarProdutos();
      },
      error: (err) => this.showToast(err.error || 'Erro ao criar produto.', 'error')
    });
  }

  consultarProdutos() {
    this.http.get<Produto[]>(`${this.baseUrl}/consultar`).subscribe({
      next: (data) => this.produtos.set(data),
      error: () => this.showToast('Erro ao consultar produtos.', 'error')
    });
  }

  editarProduto(produto: Produto) {
    this.cadastro.setValue({
      id: produto.id || '',
      nome: produto.nome || '',
      preco: produto.preco || 0,
      quantidade: produto.quantidade || 0,
      categoria: produto.categoria || ''
    });
    this.showToast(`Editando ${produto.nome}`, 'info');
  }

  alterarProduto() {
    const produto = this.cadastro.value;
    if (!produto.id) {
      this.showToast('Selecione um produto para editar.', 'error');
      return;
    }

    produto.nome = produto.nome!.toUpperCase();
    produto.categoria = produto.categoria!.toUpperCase();

    if (produto.preco! < 0) {
      this.showToast('O preço não pode ser negativo.', 'error');
      return;
    }

    this.http.put(`${this.baseUrl}/atualizar/${produto.id}`, produto).subscribe({
      next: (data: any) => {
        this.showToast(`Produto ${data.nome} atualizado!`, 'success');
        this.cadastro.reset();
        this.consultarProdutos();
      },
      error: (err) => this.showToast(err.error || 'Erro ao atualizar produto.', 'error')
    });
  }

  confirmarExclusao(produto: Produto) {
    if (produto.quantidade > 0) {
      this.showToast('Não é possível excluir produtos com estoque > 0.', 'error');
      return;
    }
    this.produtoParaExcluir = produto;
    const modal = document.getElementById('modal-confirm');
    if (modal) modal.style.display = 'flex';
  }

  fecharModal() {
    const modal = document.getElementById('modal-confirm');
    if (modal) modal.style.display = 'none';
    this.produtoParaExcluir = null;
  }

  deletarProdutoConfirmado() {
    if (!this.produtoParaExcluir) return;

    this.http.delete(`${this.baseUrl}/excluir/${this.produtoParaExcluir.id}`, { responseType: 'text' }).subscribe({
      next: (msg) => {
        this.showToast(msg, 'success');
        this.fecharModal();
        this.consultarProdutos();
      },
      error: (err) => this.showToast(err.error || 'Erro ao excluir produto.', 'error')
    });
  }
}
