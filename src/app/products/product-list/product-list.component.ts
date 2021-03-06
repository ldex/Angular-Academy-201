import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, EMPTY, combineLatest, Subscription } from 'rxjs';
import { tap, catchError, startWith, count, flatMap, map, debounceTime, filter, distinctUntilChanged } from 'rxjs/operators';

import { Product } from '../product.interface';
import { ProductService } from '../product.service';
import { FavouriteService } from '../favourite.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {

  title: string = 'Products';
  selectedProduct: Product;
//  productsNb = 0;
  errorMessage;
  filter: FormControl = new FormControl('');
  message: string;
  subscription: Subscription = new Subscription();

  // Pagination
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;

  firstPage() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }

  previousPage() {
    this.start -= this.pageSize;
    this.end -= this.pageSize;
    this.currentPage--;
    this.selectedProduct = null;
  }

  nextPage() {
    this.start += this.pageSize;
    this.end += this.pageSize;
    this.currentPage++;
    this.selectedProduct = null;
  }

  onSelect(product: Product) {
    this.selectedProduct = product;
    this.router.navigateByUrl('/products/' + product.id);
  }

  get favourites(): number {
    return this.favouriteService.getFavouritesNb();
  }

  constructor(
    private productService: ProductService,
    private favouriteService: FavouriteService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false

    this.subscription.add(
        this
          .favouriteService
          .addedFavourite$
          .pipe(
            filter(product => product != null),
            tap(console.log)
          )
          .subscribe(
            product => this.message = "Product " + product.name + " added to your favourites!"
          )
    );

    this.favouriteService.resetAddedFavourite();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  refresh() {
    this.productService.initProducts();
    this.router.navigateByUrl('/products');
  }

  products$ = this
    .productService
    .products$
    .pipe(
      
    );

  filter$ = this
      .filter
      .valueChanges
      .pipe(
        map(text => text.trim()),
        filter(text => text =='' || text.length > 2),
        debounceTime(500),
        distinctUntilChanged(),
        startWith(''),
        tap(text => this.firstPage())
      )

  
  filtered$ = this
              .filter$
              .pipe(
                map(text => text.length > 0)
              )

  filteredProducts$ = combineLatest([this.products$, this.filter$])
      .pipe(
        map(([products, filterString]) =>
          products.filter(product => 
            product.name.toLowerCase().includes(filterString.toLowerCase())
          )
        )
      )


  productsNb$ = this
    .filteredProducts$
    .pipe(
      map(products => products.length),
      startWith(0)
    )
}
